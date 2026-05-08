import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            userId = (await getAuth().verifyIdToken(token)).uid;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                try {
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { id } = await params;
        const { data: order } = await supabaseAdmin.from('dream_requests').select('*').eq('id', id).single();

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Map to expected Mongoose structure
        const mappedOrder = {
            _id: order.id,
            userId: order.user_id,
            type: order.type,
            dreamText: order.dream_text,
            context: order.context,
            status: order.status,
            createdAt: order.created_at,
            interpreterName: order.interpreter_name,
            lockedPrice: order.locked_price,
            interpretationText: order.interpretation_text
        };

        return NextResponse.json({ request: mappedOrder });

    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
