import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { interpreters, InterpreterId } from '@/lib/interpreters';

import { validateAccess } from '@/lib/accessControl';

initFirebaseAdmin();

// ... existing code ...


function buildContextString(context: any): string {
    if (!context) return '';
    const parts: string[] = [];
    if (context.gender) parts.push(context.gender === 'male' ? 'الرائي ذكر' : 'الرائية أنثى');
    if (context.socialStatus) {
        const statusMap: Record<string, string> = {
            'single': 'أعزب/عزباء',
            'married': 'متزوج/متزوجة',
            'divorced': 'مطلق/مطلقة',
            'widowed': 'أرمل/أرملة'
        };
        parts.push(`الحالة الاجتماعية: ${statusMap[context.socialStatus] || context.socialStatus}`);
    }
    if (context.dominantFeeling) parts.push(`شعور الرائي أثناء الحلم: ${context.dominantFeeling}`);
    if (context.isRecurring) parts.push('🔴 تنبيه: هذا الحلم متكرر عند الرائي');
    return parts.length > 0 ? `\n\nمعلومات عن الرائي: ${parts.join('، ')}` : '';
}

/**
 * GET /api/orders
 * Fetch user's orders with optional type filter
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Auth check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('[GET /api/orders] Auth failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const typeFilter = searchParams.get('type'); // 'AI' | 'HUMAN' | null

        // Build query
        const query: any = { userId };
        if (typeFilter) {
            query.type = typeFilter;
        }

        // Fetch orders
        const orders = await DreamRequest.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, orders });

    } catch (error) {
        console.error('[GET /api/orders] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    console.log('ORDER CREATED FROM:', 'API /orders', Date.now());
    console.log('[API] POST /api/orders (Strict Flow)');
    try {
        await dbConnect();

        let userId: string = '';
        let userEmail: string = '';
        let isGuest = false;

        // 1. Identify User (Token or Guest)
        const authHeader = req.headers.get('Authorization');
        const body = await req.json();

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await getAuth().verifyIdToken(token);
                userId = decodedToken.uid;
                userEmail = decodedToken.email || '';
            } catch (authError) {
                // Add development fallback for local testing
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[API /api/orders] Auth verification failed, falling back to insecure decoding for development.');
                    try {
                        const payload = token.split('.')[1];
                        const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                        userId = decodedValue.user_id || decodedValue.sub;
                        userEmail = decodedValue.email || '';
                        if (!userId) throw new Error('No user_id in token');
                    } catch (decodeError) {
                        console.error('[API /api/orders] Fallback decode failed:', decodeError);
                        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                    }
                } else {
                    console.error('[API] Auth failed:', authError);
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
        } else {
            // GUEST MODE
            // If no auth header, generating a temporary guest ID is NOT sufficient for strict enforcement.
            // We must rely on a persistent client identifier (x-guest-id).
            const { type } = body;

            // Only allow AI for guests
            if (type !== 'AI') {
                return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
            }

            const guestIdHeader = req.headers.get('x-guest-id');
            if (guestIdHeader) {
                userId = guestIdHeader; // Use client-provided persistent ID
                isGuest = true;
                console.log(`[API] Guest Request detected with Persistent ID: ${userId}`);
            } else {
                // Soft fallback or Strict Deny? 
                // Strict Mode: "Guest... 1 lifetime...". logic implies we need a stable ID.
                // If client didn't send one, we can generate one but we MUST tell client to save it? 
                // Or we deny?
                // Let's allow generation but logs will show it as new guest. 
                // Ideally frontend ALWAYS sends it.
                userId = `guest_${crypto.randomUUID()}`;
                isGuest = true;
                console.log(`[API] Guest Request WITHOUT ID. Assigned ephemeral: ${userId}`);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, dreamText, context, interpreter, interpreterId, interpreterName } = body;

        // Validate type
        if (!type || !['AI', 'HUMAN'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type. Must be AI or HUMAN.' }, { status: 400 });
        }

        if (!dreamText || dreamText.trim().length < 10) {
            return NextResponse.json({ error: 'Dream text is required (min 10 chars).' }, { status: 400 });
        }

        // ============================================================
        // IDEMPOTENCY KEY GENERATION (The Core Protection)
        // sha256(userId + "_" + dreamText_first100 + "_" + interpreterId + "_" + type)
        // This ensures the same user sending the same dream to same interpreter gets same order
        // ============================================================
        const normalizedDreamText = dreamText.trim().substring(0, 100).toLowerCase(); // Normalize text
        const safeInterpreterId = interpreterId || 'any'; // Handle AI or undefined
        const rawKey = `${userId}_${normalizedDreamText}_${safeInterpreterId}_${type}`;
        const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        console.log('[IDEMPOTENCY] Key generated:', {
            userId: userId.substring(0, 8),
            dreamPreview: normalizedDreamText.substring(0, 30),
            interpreterId: safeInterpreterId,
            type,
            key: idempotencyKey.substring(0, 16) + '...'
        });

        // Also keep legacy dreamHash for broader duplicate search if needed
        const dreamHash = crypto.createHash('sha256').update(`${userId}_${dreamText.trim().toLowerCase()}`).digest('hex');

        // ============================================================
        // TRANSACTION START
        // ============================================================
        const conn = await dbConnect();
        const session = await conn.startSession();
        let result: any = null;

        await session.withTransaction(async () => {
            // 2. STRICT ACCESS CONTROL (Inside Transaction)
            // MOVED UP for scoping
            console.error('🔥 ORDER CREATE TRIGGERED', {
                sourceFile: 'src/app/api/orders/route.ts',
                timestamp: new Date().toISOString(),
                stack: new Error().stack,
            });
            let dbUser = null;
            let useFreeDaily = false;
            let useCredit = false;

            // Call strict validator
            const access = await validateAccess(userId, isGuest, session);

            if (!access.allowed) {
                const error = new Error(access.reason.toUpperCase());
                (error as any).status = 403;
                (error as any).details = {
                    code: access.reason.toUpperCase(),
                    nextReset: access.nextReset
                };
                throw error;
            }

            // Map allowed mode to local flags
            if (access.mode === 'free') useFreeDaily = true;
            if (access.mode === 'credit') useCredit = true;
            // Guest mode implies free daily effectively (but handled as 'guest' mode logic if needed, 
            // though for Guest, we just proceed. We need to fetch DB user if NOT guest).

            if (!isGuest) {
                dbUser = await User.findOne({ firebaseUid: userId }).session(session);
            }

            // 3. ATOMIC UPSERT (The Real Fix)
            // Instead of findOne -> create, we use findOneAndUpdate with upsert=true
            // This relies on the unique index on `idempotencyKey` effectively, but handles race conditions better at DB level

            // Prepare the document to insert/update
            const now = new Date();
            const sanitizedContext = {
                gender: context?.gender,
                socialStatus: context?.socialStatus,
                dominantFeeling: context?.dominantFeeling,
                isRecurring: context?.isRecurring
            };

            // Define update operations
            const updateOp = {
                $setOnInsert: {
                    type,
                    userId,
                    userEmail,
                    dreamText: dreamText.trim(),
                    dreamHash,
                    idempotencyKey,
                    context: sanitizedContext,
                    interpreterId: interpreterId || undefined,
                    interpreterName: interpreterName || undefined,
                    price: (type === 'AI' && !useFreeDaily) ? 1 : 0,
                    lockedPrice: 0,
                    status: type === 'AI' ? 'in_progress' : 'new',
                    paymentStatus: type === 'AI' ? 'paid' : 'pending',
                    startedAt: type === 'AI' ? now : undefined,
                    assignedAt: type === 'AI' ? now : undefined,
                }
            };

            const newOrder = await DreamRequest.findOneAndUpdate(
                { idempotencyKey },
                updateOp,
                {
                    upsert: true,
                    new: true,
                    session,
                    setDefaultsOnInsert: true
                }
            );

            // Logic: If the doc existed, $setOnInsert did nothing.
            // If we want to know if it's new, we can check `createdAt` vs `now`.
            const isNew = Math.abs(newOrder.createdAt.getTime() - now.getTime()) < 2000;

            console.log('[UPSERT RESULT]', {
                orderId: newOrder._id.toString(),
                isNew: isNew,
                status: newOrder.status,
                createdAt: newOrder.createdAt,
                interpreterId: newOrder.interpreterId || 'none'
            });

            if (!isNew) {
                console.log(`[API] ⚠️ IDEMPOTENCY HIT: Returning existing order ${newOrder._id}`);
                result = {
                    order: newOrder,
                    isDuplicate: true,
                    mode: 'existing'
                };
                return; // Return from transaction loop
            }

            console.log(`[API] ✅ NEW ORDER CREATED: ${newOrder._id}`);

            // 4. Update User Credits (AI Only)
            if (type === 'AI' && !isGuest && dbUser) {
                if (useFreeDaily) {
                    dbUser.lastFreeDreamAt = new Date();
                } else if (useCredit) {
                    dbUser.credits -= 1;
                }
                await dbUser.save({ session });
            }

            result = {
                order: newOrder,
                isDuplicate: false,
                user: dbUser,
                mode: useFreeDaily ? 'free' : 'credit'
            };
        });

        await session.endSession();

        if (!result) return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });

        const { order, isDuplicate } = result;

        // ============================================================
        // SIDE EFFECTS (OUTSIDE TRANSACTION)
        // ============================================================

        // A) If duplicate, just return it
        if (isDuplicate) {
            return NextResponse.json({
                success: true,
                upsert: true,
                orderId: order._id,
                order: order,
                message: 'Returned existing order'
            });
        }

        // B) Run AI if needed
        let interpretationText = '';
        if (type === 'AI') {
            try {
                // ... AI Logic ...
                const interpreterKey = (interpreter as InterpreterId) in interpreters ? (interpreter as InterpreterId) : 'ibn-sirin';
                const selectedInterpreter = interpreters[interpreterKey];
                const contextString = buildContextString(order.context);
                const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

                if (!OPENROUTER_API_KEY) {
                    await new Promise(r => setTimeout(r, 1000));
                    interpretationText = `(AI Mock) تفسير تجريبي للحلم: ${dreamText.substring(0, 20)}...`;
                } else {
                    const structuredInstructions = `
 يجب أن يكون تفسيرك مقسمًا بدقة إلى الأقسام التالية (استخدم العناوين بخط عريض):
 1. **خلاصة سريعة**: (سطرين كحد أقصى يعطي المعنى المباشر)
 2. **تفسير تفصيلي**: (شرح الرموز وترابطها)
 3. **نصيحة أو تنبيه**: (توجيه عملي للرائي بناءً على الحلم)
 
 خاطب الرائي بصيغة: ${order.context?.gender === 'female' ? 'أنثى' : 'ذكر'}.
 ديانة: إسلامي.
 `;
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                            "X-Title": "Almofasser",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "openai/gpt-4o-mini",
                            messages: [
                                { role: "system", content: selectedInterpreter.systemPrompt + contextString + structuredInstructions },
                                { role: "user", content: `حلمي: ${dreamText}` }
                            ]
                        })
                    });
                    if (response.ok) {
                        const aiData = await response.json();
                        interpretationText = aiData.choices[0]?.message?.content || "No response";
                    } else {
                        interpretationText = "عذراً، حدث خطأ في خدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
                    }
                }
            } catch (e) {
                console.error('AI Error', e);
                interpretationText = "حدث خطأ غير متوقع أثناء التفسير.";
            }

            // Update with AI result (Idempotent update)
            await DreamRequest.findByIdAndUpdate(order._id, {
                interpretationText,
                status: 'completed',
                completedAt: new Date()
            });
        }

        return NextResponse.json({
            success: true,
            orderId: order._id,
            order: order,
            interpretation: interpretationText,
            remainingCredits: result.user ? result.user.credits : 0
        });

    } catch (error: any) {
        console.error('[API] Order Global Error:', error);
        const status = (error as any).status || 500;
        return NextResponse.json(
            { error: error.message || 'Internal Error', details: (error as any).details },
            { status }
        );
    }
}
