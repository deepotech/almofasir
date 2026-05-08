import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const action = searchParams.get('action');
        const adminEmail = searchParams.get('email');

        let query = supabaseAdmin
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (action && action !== 'all') query = query.eq('action', action);
        if (adminEmail) query = query.ilike('admin_email', `%${adminEmail}%`);

        const { data: logs, count, error } = await query;
        if (error) throw error;

        const total = count ?? 0;

        return NextResponse.json({
            logs: logs ?? [],
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Fetch audit logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
