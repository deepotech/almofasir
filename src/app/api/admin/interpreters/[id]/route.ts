import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { id } = params;
        const body = await req.json();
        const { status, price } = body;

        const { data: interpreter } = await supabaseAdmin
            .from('interpreters')
            .select('id, status, price, user_id')
            .eq('id', id)
            .maybeSingle();

        if (!interpreter) {
            return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        const auditDetails: Record<string, unknown> = {
            prevStatus: interpreter.status,
            prevPrice: interpreter.price,
        };
        let action: string = 'update_settings';

        if (status && ['active', 'suspended', 'pending'].includes(status)) {
            updateData.status = status;
            auditDetails.newStatus = status;
            if (status === 'suspended') action = 'suspend_interpreter';
            else if (status === 'active' && interpreter.status === 'pending') action = 'approve_interpreter';
            else if (status === 'active' && interpreter.status === 'suspended') action = 'reactivate_interpreter';
        }

        if (price !== undefined && typeof price === 'number') {
            updateData.price = price;
            auditDetails.newPrice = price;
            if (!status) action = 'edit_price';
        }

        if (Object.keys(updateData).length > 0) {
            await supabaseAdmin.from('interpreters').update(updateData).eq('id', id);

            await supabaseAdmin.from('audit_logs').insert({
                admin_user_id: auth.admin.id,
                admin_email: auth.admin.email,
                action,
                target_type: 'interpreter',
                target_id: id,
                details: auditDetails,
                ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            });
        }

        const { data: updated } = await supabaseAdmin
            .from('interpreters')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({ interpreter: updated });

    } catch (error) {
        console.error('Update interpreter error:', error);
        return NextResponse.json({ error: 'Failed to update interpreter' }, { status: 500 });
    }
}
