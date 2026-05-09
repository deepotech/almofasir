import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { interpreters, InterpreterId } from '@/lib/interpreters';
import { verifyRateLimit } from '@/lib/ratelimit';
import { dispatchToQStash, hasQstashConfig } from '@/lib/qstash';
import { logger } from '@/lib/logger';
import { validateAccess } from '@/lib/accessControl';
import { interpretDream, buildContextString } from '@/lib/dreamInterpreter';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split('Bearer ')[1];
        
        let userId: string;
        try {
            userId = (await getAuth().verifyIdToken(token)).uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const typeFilter = searchParams.get('type');

        let query = supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (typeFilter) {
            query = query.eq('type', typeFilter);
        }

        const { data: orders } = await query;
        
        // Map to Mongoose-like structure for frontend compat
        const mappedOrders = (orders ?? []).map(o => ({
            _id: o.id,
            userId: o.user_id,
            type: o.type,
            dreamText: o.dream_text,
            context: o.context,
            status: o.status,
            createdAt: o.created_at,
            interpreterName: o.interpreter_name,
            lockedPrice: o.locked_price,
            interpretationText: o.interpretation_text
        }));

        return NextResponse.json({ success: true, orders: mappedOrders });
    } catch (error) {
        console.error('[GET /api/orders] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success: rateLimitSuccess } = await verifyRateLimit(ip);
        if (!rateLimitSuccess) {
            return NextResponse.json({ success: false, error: 'Too many requests.', data: null }, { status: 429 });
        }

        let userId = '';
        let userEmail = '';
        let isGuest = false;

        const authHeader = req.headers.get('Authorization');
        const body = await req.json();

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await getAuth().verifyIdToken(token);
                userId = decodedToken.uid;
                userEmail = decodedToken.email || '';
            } catch {
                if (process.env.NODE_ENV === 'development') {
                    try {
                        const payload = token.split('.')[1];
                        const d = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                        userId = d.user_id || d.sub;
                        userEmail = d.email || '';
                    } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
                } else {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
        } else {
            const { type } = body;
            if (type !== 'AI') return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
            const guestIdHeader = req.headers.get('x-guest-id');
            if (guestIdHeader) {
                userId = guestIdHeader;
                isGuest = true;
            } else {
                userId = `guest_${crypto.randomUUID()}`;
                isGuest = true;
            }
        }

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { type, dreamText, context, interpreter, interpreterId, interpreterName } = body;

        if (!type || !['AI', 'HUMAN'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type. Must be AI or HUMAN.' }, { status: 400 });
        }

        if (!dreamText || dreamText.trim().split(/\s+/).filter(Boolean).length < 15) {
            return NextResponse.json({ error: 'حلمك قصير جداً. يرجى وصف الحلم بتفاصيل أكثر (15 كلمة على الأقل).', code: 'DREAM_TOO_SHORT' }, { status: 400 });
        }

        const normalizedDreamText = dreamText.trim().substring(0, 100).toLowerCase();
        const safeInterpreterId = interpreterId || 'any';
        const rawKey = `${userId}_${normalizedDreamText}_${safeInterpreterId}_${type}`;
        const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');
        const dreamHash = crypto.createHash('sha256').update(`${userId}_${dreamText.trim().toLowerCase()}`).digest('hex');

        // Access validation
        const access = await validateAccess(userId, isGuest);
        if (!access.allowed) {
            return NextResponse.json({ success: false, error: access.reason.toUpperCase(), data: null }, { status: 403 });
        }

        const useFreeDaily = access.mode === 'free';
        const useCredit = access.mode === 'credit';
        const now = new Date().toISOString();
        const sanitizedContext = { gender: context?.gender, socialStatus: context?.socialStatus, dominantFeeling: context?.dominantFeeling, isRecurring: context?.isRecurring };

        // Atomic Upsert via Supabase (since we have a unique constraint on idempotency_key)
        const insertData = {
            type,
            user_id: userId,
            user_email: userEmail,
            dream_text: dreamText.trim(),
            dream_hash: dreamHash,
            idempotency_key: idempotencyKey,
            context: sanitizedContext,
            interpreter_id: interpreterId || null,
            interpreter_name: interpreterName || null,
            price: (type === 'AI' && !useFreeDaily) ? 1 : 0,
            locked_price: 0,
            status: type === 'AI' ? 'in_progress' : 'new',
            payment_status: type === 'AI' ? 'paid' : 'pending',
            started_at: type === 'AI' ? now : null,
            assigned_at: type === 'AI' ? now : null,
        };

        const { data: newOrder, error: upsertError } = await supabaseAdmin
            .from('dream_requests')
            .upsert(insertData, { onConflict: 'idempotency_key', ignoreDuplicates: true })
            .select()
            .single();

        let isDuplicate = false;
        let finalOrder = newOrder;

        if (upsertError || !newOrder) {
            // It was a duplicate
            const { data: existing } = await supabaseAdmin.from('dream_requests').select('*').eq('idempotency_key', idempotencyKey).single();
            finalOrder = existing;
            isDuplicate = true;
        }

        let dbUser = null;
        if (!isDuplicate && type === 'AI' && !isGuest) {
            // Deduct credits or update free dream
            if (useFreeDaily) {
                const { data } = await supabaseAdmin.from('users').update({ last_free_dream_at: now }).eq('firebase_uid', userId).select().single();
                dbUser = data;
            } else if (useCredit) {
                // decrement via rpc or read-update
                const { data: userCurrent } = await supabaseAdmin.from('users').select('credits').eq('firebase_uid', userId).single();
                const newCredits = Math.max(0, (userCurrent?.credits || 0) - 1);
                const { data } = await supabaseAdmin.from('users').update({ credits: newCredits }).eq('firebase_uid', userId).select().single();
                dbUser = data;
            }
        }

        // Map final order to Mongoose style
        const orderDoc = {
            _id: finalOrder.id,
            status: finalOrder.status,
            createdAt: finalOrder.created_at,
            context: finalOrder.context
        };

        if (isDuplicate) {
            return NextResponse.json({ success: true, upsert: true, orderId: orderDoc._id, order: orderDoc, message: 'Returned existing order' });
        }

        let interpretationText = '';
        let responseSymbols: any[] = [];
        let responseConfidence = 0;
        let responseType = 'عام';

        if (type === 'AI') {
            try {
                const interpreterKey = (interpreter as InterpreterId) in interpreters ? (interpreter as InterpreterId) : 'ibn-sirin';
                const contextString = buildContextString(orderDoc.context);

                let qstashDispatched = false;
                if (hasQstashConfig) {
                    try {
                        await dispatchToQStash('/api/jobs/process-dream', {
                            orderId: orderDoc._id,
                            dreamText,
                            context: orderDoc.context,
                            contextString,
                            interpreterKey,
                        });
                        interpretationText = 'جاري تحليل الحلم الآن... يرجى التحقق من قسم الأحلام لاحقاً.';
                        qstashDispatched = true;
                    } catch (err) { logger.error('QStash failed', { event: 'QSTASH_FALLBACK' }, err); }
                }

                if (!qstashDispatched) {
                    const aiResult = await interpretDream(dreamText, orderDoc.context, 1);
                    interpretationText = aiResult.text;
                    responseSymbols = aiResult.symbols;
                    responseConfidence = aiResult.confidenceScore;
                    responseType = aiResult.type;

                    await supabaseAdmin.from('dream_requests').update({
                        interpretation_text: interpretationText,
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    }).eq('id', orderDoc._id);
                }
            } catch (e) {
                logger.error('AI error', { event: 'AI_ERROR' }, e);
                interpretationText = 'حدث خطأ غير متوقع أثناء التفسير. يرجى المحاولة مجدداً.';
            }
        }

        return NextResponse.json({
            success: true,
            orderId: orderDoc._id,
            order: orderDoc,
            interpretation: interpretationText,
            symbols: responseSymbols,
            type: responseType,
            confidenceScore: responseConfidence,
            remainingCredits: dbUser ? dbUser.credits : 0,
        });

    } catch (error: any) {
        console.error('[API] Order Global Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Error', data: null }, { status: 500 });
    }
}
