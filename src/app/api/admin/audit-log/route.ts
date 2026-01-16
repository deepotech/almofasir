
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const action = searchParams.get('action');
        const adminEmail = searchParams.get('email');

        const filter: any = {};
        if (action && action !== 'all') filter.action = action;
        if (adminEmail) filter.adminEmail = { $regex: adminEmail, $options: 'i' };

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AuditLog.countDocuments(filter);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Fetch audit logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
