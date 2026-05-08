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
        const { newInterpreterId } = await req.json();

        if (!newInterpreterId) {
            return NextResponse.json({ error: 'New interpreter ID is required' }, { status: 400 });
        }

        const { data: order } = await supabaseAdmin
            .from('dream_requests')
            .select('id, status, interpreter_id')
            .eq('id', id)
            .maybeSingle();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const { data: newInterpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, user_id, display_name')
            .eq('id', newInterpreterId)
            .maybeSingle();

        if (!newInterpreter) {
            return NextResponse.json({ error: 'Target interpreter not found' }, { status: 404 });
        }

        const oldInterpreterId = order.interpreter_id;

        const { data: updatedOrder, error } = await supabaseAdmin
            .from('dream_requests')
            .update({
                interpreter_id: newInterpreterId,
                interpreter_user_id: newInterpreter.user_id,
                interpreter_name: newInterpreter.display_name,
                status: 'assigned',
                assigned_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await supabaseAdmin.from('audit_logs').insert({
            admin_user_id: auth.admin.id,
            admin_email: auth.admin.email,
            action: 'reassign_order',
            target_type: 'order',
            target_id: id,
            details: {
                oldInterpreter: oldInterpreterId,
                newInterpreter: newInterpreterId,
                reason: 'Admin reassignment',
            },
            ip_address: req.headers.get('x-forwarded-for'),
        });

        return NextResponse.json({ success: true, order: updatedOrder });

    } catch (error) {
        console.error('Reassign order error:', error);
        return NextResponse.json({ error: 'Failed to reassign order' }, { status: 500 });
    }
}
