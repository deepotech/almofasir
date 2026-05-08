import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { STUCK_ORDER_THRESHOLD_HOURS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const urgentThresholdDate = new Date(Date.now() - STUCK_ORDER_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();
        const warningThresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const activeInterpreterThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
            dreamsTodayResp,
            paidOrdersTodayResp,
            paidOrdersWeekResp,
            activeInterpretersResp,
            pendingOrdersResp,
            aiFailuresResp,
            revenueResp,
            settingsResp
        ] = await Promise.all([
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart.toISOString())
                .neq('status', 'cancelled'),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart.toISOString())
                .eq('payment_status', 'paid'),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true })
                .gte('created_at', weekStart.toISOString())
                .eq('payment_status', 'paid'),
            supabaseAdmin.from('interpreters').select('*', { count: 'exact', head: true })
                .eq('status', 'active')
                .gte('updated_at', activeInterpreterThreshold),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true })
                .or(`and(status.eq.new,created_at.lt.${urgentThresholdDate}),and(status.eq.assigned,updated_at.lt.${warningThresholdDate})`),
            supabaseAdmin.from('dream_requests').select('*', { count: 'exact', head: true })
                .eq('type', 'AI')
                .eq('status', 'cancelled')
                .gte('created_at', weekStart.toISOString()),
            supabaseAdmin.from('dream_requests').select('locked_price, platform_commission').eq('payment_status', 'paid'),
            supabaseAdmin.from('platform_settings').select('*').single()
        ]);

        let totalRevenue = 0;
        let platformCommissionTotal = 0;
        
        (revenueResp.data || []).forEach(r => {
            totalRevenue += (r.locked_price || 0);
            platformCommissionTotal += (r.platform_commission || 0);
        });

        return NextResponse.json({
            dreamsToday: dreamsTodayResp.count || 0,
            paidOrdersToday: paidOrdersTodayResp.count || 0,
            paidOrdersWeek: paidOrdersWeekResp.count || 0,
            totalRevenue: totalRevenue,
            platformCommission: platformCommissionTotal,
            activeInterpreters: activeInterpretersResp.count || 0,
            pendingOrders: pendingOrdersResp.count || 0,
            aiFailures: aiFailuresResp.count || 0,
            commissionRate: settingsResp.data?.commission_rate || 0.3
        });

    } catch (error) {
        console.error('Stats overview error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
