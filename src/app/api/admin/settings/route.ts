import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { getSettings, updateSettings } from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const settings = await getSettings();
        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Fetch settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const updates = await req.json();

        const oldSettings = await getSettings();
        const settings = await updateSettings(updates, auth.admin.email);

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            admin_user_id: auth.admin.id,
            admin_email: auth.admin.email,
            action: 'update_settings',
            target_type: 'settings',
            target_id: oldSettings.id ?? 'singleton',
            details: {
                changes: updates,
                diff: Object.keys(updates).reduce((acc: any, key) => {
                    const oldVal = (oldSettings as any)[key];
                    if (oldVal !== updates[key]) {
                        acc[key] = { from: oldVal, to: updates[key] };
                    }
                    return acc;
                }, {}),
            },
            ip_address: req.headers.get('x-forwarded-for'),
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
