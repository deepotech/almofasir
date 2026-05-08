import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { id } = params;
        const { reason, restoreCredits } = await req.json();

        const { data: order } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, payment_status, user_id, locked_price')
            .eq('id', id)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.payment_status === 'refunded') {
            return NextResponse.json({ error: 'Order already refunded' }, { status: 400 });
        }

        const oldStatus = order.status;
        const oldPaymentStatus = order.payment_status;

        await supabaseAdmin
            .from('dream_requests')
            .update({
                status: 'cancelled',
                payment_status: 'refunded',
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', id);

        // Restore credits if applicable
        if (restoreCredits && order.user_id) {
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('id, credits, firebase_uid')
                .eq('firebase_uid', order.user_id)
                .maybeSingle();

            if (user) {
                await supabaseAdmin
                    .from('users')
                    .update({ credits: (user.credits || 0) + 1 })
                    .eq('id', user.id);
            }
        }

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_user_id: auth.admin.id,
            admin_email: auth.admin.email,
            action: 'refund_order',
            target_type: 'order',
            target_id: id,
            details: {
                reason,
                oldStatus,
                oldPaymentStatus,
                creditsRestored: !!restoreCredits,
            },
            ip_address: req.headers.get('x-forwarded-for'),
        });

        return NextResponse.json({ success: true, message: 'Order refunded successfully' });

    } catch (error) {
        console.error('Refund order error:', error);
        return NextResponse.json({ error: 'Failed to refund order' }, { status: 500 });
    }
}
