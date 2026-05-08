import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);

        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const interpreterId = searchParams.get('interpreterId');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        let query = supabaseAdmin
            .from('dream_requests')
            .select('*', { count: 'exact' });

        if (type && type !== 'all') query = query.eq('type', type);
        if (status && status !== 'all') query = query.eq('status', status);
        if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            query = query.lte('created_at', end.toISOString());
        }
        if (interpreterId) query = query.eq('interpreter_id', interpreterId);

        if (search) {
            // Is it a UUID?
            if (search.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
                query = query.eq('id', search);
            } else {
                // Otherwise search by email
                query = query.ilike('user_email', `%${search}%`);
            }
        }

        query = query.order('created_at', { ascending: false }).range(skip, skip + limit - 1);

        const { data: orders, count, error } = await query;
        if (error) throw error;

        // Map to mongoose style
        const mappedOrders = (orders || []).map((o: any) => ({
            _id: o.id,
            type: o.type,
            status: o.status,
            userId: o.user_id,
            userEmail: o.user_email,
            interpreterId: o.interpreter_id,
            interpreterName: o.interpreter_name,
            dreamText: o.dream_text,
            price: o.price,
            createdAt: o.created_at,
            updatedAt: o.updated_at
        }));

        const total = count || 0;

        return NextResponse.json({
            orders: mappedOrders,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Fetch orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
