import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[API] POST /api/orders/[id]/select-interpreter (UPDATE ONLY)');

    try {
        const { id: orderId } = await params;

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
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { interpreterId } = body;

        if (!interpreterId) {
            return NextResponse.json({ error: 'interpreterId is required' }, { status: 400 });
        }

        // Verify order exists and belongs to user
        const { data: order } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, user_id, interpreter_id')
            .eq('id', orderId)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden: Not your order' }, { status: 403 });
        }

        if (order.interpreter_id) {
            return NextResponse.json({ error: 'Dream already assigned to an interpreter' }, { status: 409 });
        }

        if (!['new', 'pending'].includes(order.status)) {
            return NextResponse.json({
                error: 'Order cannot be modified. Current status: ' + order.status
            }, { status: 400 });
        }

        // Fetch interpreter
        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, user_id, display_name, price, status')
            .eq('id', interpreterId)
            .maybeSingle();

        if (!interpreter || interpreter.status !== 'active') {
            return NextResponse.json({ error: 'Interpreter not found or inactive' }, { status: 404 });
        }

        // Update order
        const { data: updatedOrder, error } = await supabaseAdmin
            .from('dream_requests')
            .update({
                interpreter_id: interpreter.id,
                interpreter_user_id: interpreter.user_id,
                interpreter_name: interpreter.display_name || '',
                price: interpreter.price || 0,
                locked_price: interpreter.price || 0,
                status: 'assigned',
                payment_status: 'pending',
                assigned_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;

        console.log(`[API] Order ${orderId} updated with interpreter ${interpreterId}`);

        return NextResponse.json({
            success: true,
            orderId: updatedOrder?.id,
            order: updatedOrder,
            message: 'Interpreter assigned. Proceed to payment.',
        });

    } catch (error: any) {
        console.error('[API] select-interpreter failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
