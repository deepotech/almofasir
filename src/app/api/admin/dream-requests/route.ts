import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/adminAuth';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin role
        const { data: adminUser } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('firebase_uid', userId)
            .maybeSingle();

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const interpreterId = searchParams.get('interpreterId');
        const requestUserId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from('dream_requests')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (interpreterId) query = query.eq('interpreter_id', interpreterId);
        if (requestUserId) query = query.eq('user_id', requestUserId);

        const { data: requests, count, error } = await query;
        if (error) throw error;

        const total = count ?? 0;

        // Stats counts
        const [totalRes, newRes, inProgressRes, completedRes, revenueRes] = await Promise.all([
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            supabaseAdmin.from('dream_requests').select('platform_commission').in('status', ['completed', 'clarification_requested', 'closed']),
        ]);

        let totalRevenue = 0;
        (revenueRes.data || []).forEach((row: any) => totalRevenue += (row.platform_commission || 0));

        const stats = {
            total: totalRes.count ?? 0,
            new: newRes.count ?? 0,
            inProgress: inProgressRes.count ?? 0,
            completed: completedRes.count ?? 0,
            totalRevenue,
        };

        return NextResponse.json({
            requests: requests ?? [],
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Error fetching admin dream requests:', error);
        return NextResponse.json({ error: 'حدث خطأ في جلب الطلبات' }, { status: 500 });
    }
}
