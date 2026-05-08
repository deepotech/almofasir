import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await getAuth().verifyIdToken(token)).uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { data: dream, error } = await supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('id', id)
            .eq('interpreter_user_id', userId)
            .eq('type', 'HUMAN')
            .maybeSingle();

        if (error || !dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        const mappedDream = {
            _id: dream.id,
            content: dream.dream_text,
            context: dream.context || {},
            price: dream.locked_price || dream.price || 0,
            interpreterEarning: (dream.locked_price || dream.price || 0) * 0.8,
            status: mapStatusToFrontend(dream.status),
            deadline: calculateDeadline(dream.created_at),
            interpretation: dream.interpretation_text,
            createdAt: dream.created_at,
            aiSuggestion: null,
        };

        return NextResponse.json({ dream: mappedDream });

    } catch (error) {
        console.error('Error fetching dream:', error);
        return NextResponse.json({ error: 'Failed to fetch dream' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await getAuth().verifyIdToken(token)).uid;
        } catch {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decoded.user_id || decoded.sub;
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { action, interpretation } = body;

        const { data: dream, error } = await supabaseAdmin
            .from('dream_requests')
            .select('*')
            .eq('id', id)
            .eq('interpreter_user_id', userId)
            .maybeSingle();

        if (error || !dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        let updates: Record<string, unknown> = {};

        if (action === 'start') {
            if (dream.status === 'completed') {
                return NextResponse.json({ error: 'Already completed' }, { status: 400 });
            }
            updates = { status: 'in_progress', started_at: new Date().toISOString() };

        } else if (action === 'submit') {
            if (!interpretation || interpretation.trim().length < 50) {
                return NextResponse.json({ error: 'التفسير قصير جداً' }, { status: 400 });
            }
            updates = {
                interpretation_text: interpretation,
                status: 'completed',
                completed_at: new Date().toISOString(),
                payment_status: 'released',
            };

            // Update interpreter stats
            const earning = (dream.locked_price || dream.price || 0) * 0.8;
            await supabaseAdmin.rpc('increment_interpreter_stats', {
                p_user_id: userId,
                p_earning: earning,
            }).catch(() => {
                // Fallback: manual increment
                supabaseAdmin
                    .from('interpreters')
                    .select('completed_dreams, pending_earnings')
                    .eq('user_id', userId)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            supabaseAdmin.from('interpreters').update({
                                completed_dreams: (data.completed_dreams || 0) + 1,
                                pending_earnings: (data.pending_earnings || 0) + earning,
                            }).eq('user_id', userId);
                        }
                    });
            });

        } else if (action === 'answer_followup') {
            const { followUpAnswer } = body;
            if (!followUpAnswer || followUpAnswer.trim().length < 10) {
                return NextResponse.json({ error: 'الرد قصير جداً' }, { status: 400 });
            }
            if (!dream.clarification_question) {
                return NextResponse.json({ error: 'No pending follow-up question' }, { status: 400 });
            }
            updates = {
                clarification_answer: followUpAnswer,
                clarification_answered_at: new Date().toISOString(),
            };
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('dream_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        const mappedDream = {
            _id: updated.id,
            content: updated.dream_text,
            context: updated.context || {},
            price: updated.locked_price || updated.price || 0,
            interpreterEarning: (updated.locked_price || updated.price || 0) * 0.8,
            status: mapStatusToFrontend(updated.status),
            deadline: calculateDeadline(updated.created_at),
            interpretation: updated.interpretation_text,
            createdAt: updated.created_at,
        };

        return NextResponse.json({ success: true, dream: mappedDream });

    } catch (error) {
        console.error('Error updating dream:', error);
        return NextResponse.json({ error: 'Failed to update dream' }, { status: 500 });
    }
}

function mapStatusToFrontend(status: string): string {
    const map: Record<string, string> = {
        'new': 'pending_interpretation',
        'assigned': 'pending_interpretation',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'expired',
    };
    return map[status] || 'pending_interpretation';
}

function calculateDeadline(createdAt: string): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
}
