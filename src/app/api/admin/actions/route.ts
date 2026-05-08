import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { updateSettings } from '@/lib/platformSettings';

export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { action, payload } = await req.json();
        let result: any = null;

        switch (action) {
            case 'APPROVE_INTERPRETER':
                if (!payload.userId) throw new Error('Missing userId');
                const { data: approved } = await supabaseAdmin
                    .from('interpreters')
                    .update({ status: 'active', is_active: true })
                    .eq('user_id', payload.userId)
                    .select()
                    .single();
                result = approved;
                break;

            case 'SUSPEND_INTERPRETER':
                if (!payload.userId) throw new Error('Missing userId');
                const { data: suspended } = await supabaseAdmin
                    .from('interpreters')
                    .update({ status: 'suspended', is_active: false })
                    .eq('user_id', payload.userId)
                    .select()
                    .single();
                result = suspended;
                break;

            case 'UPDATE_COMMISSION':
                if (typeof payload.rate !== 'number') throw new Error('Invalid rate');
                result = await updateSettings({ commission_rate: payload.rate }, auth.admin.id);
                break;

            case 'PAUSE_AI':
                // Toggle maintenance mode as AI-pause equivalent
                const { data: currentSettings } = await supabaseAdmin
                    .from('platform_settings')
                    .select('maintenance_mode')
                    .limit(1)
                    .single();
                result = await updateSettings(
                    { maintenance_mode: !currentSettings?.maintenance_mode },
                    auth.admin.id
                );
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Audit log
        try {
            await supabaseAdmin.from('audit_logs').insert({
                admin_user_id: auth.admin.id,
                admin_email: auth.admin.email,
                action: action.toLowerCase(),
                target_type: 'system',
                target_id: payload.userId || 'platform',
                details: payload,
                ip_address: req.headers.get('x-forwarded-for'),
            });
        } catch (logError) {
            console.warn('Audit log failed', logError);
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('Admin action error:', error);
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
    }
}
