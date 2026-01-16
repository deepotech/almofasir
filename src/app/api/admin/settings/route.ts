
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import PlatformSettings, { getSettings } from '@/models/PlatformSettings';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
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
        await dbConnect();
        const updates = await req.json();

        const settings = await getSettings();
        const oldSettings = settings.toObject();

        // Apply updates
        Object.assign(settings, updates);
        settings.updatedBy = auth.admin.email;
        await settings.save();

        // Audit Log
        await AuditLog.create({
            adminUserId: auth.admin._id,
            adminEmail: auth.admin.email,
            action: 'update_settings',
            targetType: 'settings',
            targetId: settings._id,
            details: {
                changes: updates,
                diff: Object.keys(updates).reduce((acc: any, key) => {
                    if (oldSettings[key] !== updates[key]) {
                        acc[key] = { from: oldSettings[key], to: updates[key] };
                    }
                    return acc;
                }, {})
            },
            ipAddress: req.headers.get('x-forwarded-for')
        });

        return NextResponse.json({ settings });

    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
