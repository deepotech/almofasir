import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { STUCK_ORDER_THRESHOLD_HOURS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const urgentThresholdDate = new Date(Date.now() - STUCK_ORDER_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();
        const warningThresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Status 'new' AND created > Threshold
        // 2. Status 'assigned' AND updated > 24h
        const { data: urgentOrders, error } = await supabaseAdmin
            .from('dream_requests')
            .select('id, user_id, interpreter_name, status, type, created_at, updated_at, payment_status, price')
            .or(`and(status.eq.new,created_at.lt.${urgentThresholdDate},payment_status.eq.paid),and(status.eq.assigned,updated_at.lt.${warningThresholdDate},payment_status.eq.paid)`)
            .order('created_at', { ascending: true })
            .limit(20);

        if (error) throw error;

        const serialized = (urgentOrders || []).map((order: any) => ({
            id: order.id,
            type: order.type,
            status: order.status,
            customer: order.user_id.substring(0, 6) + '...',
            interpreter: order.interpreter_name || 'Unassigned',
            waitingTimeHours: Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)),
            lastUpdateHours: Math.floor((Date.now() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60)),
            amount: order.price
        }));

        return NextResponse.json({ orders: serialized });

    } catch (error) {
        console.error('Urgent orders fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch urgent orders' }, { status: 500 });
    }
}
