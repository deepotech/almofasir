import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { rating, feedback } = body;

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be a number between 1 and 5' },
                { status: 400 }
            );
        }

        const { data: order } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, user_id')
            .eq('id', params.id)
            .eq('user_id', userId)
            .maybeSingle();

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found or you do not have permission to rate it' },
                { status: 404 }
            );
        }

        if (order.status !== 'completed') {
            return NextResponse.json({ error: 'Can only rate completed orders' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {
            rating,
            rated_at: new Date().toISOString(),
        };
        if (feedback) updates.feedback = feedback;

        const { data: updated, error } = await supabaseAdmin
            .from('dream_requests')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        console.log(`[Rate API] Order ${params.id} rated: ${rating}/5`);

        return NextResponse.json({
            success: true,
            order: {
                _id: updated.id,
                rating: updated.rating,
                feedback: updated.feedback,
                ratedAt: updated.rated_at,
            },
        });

    } catch (error) {
        console.error('[Rate API] Error:', error);
        return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
    }
}
