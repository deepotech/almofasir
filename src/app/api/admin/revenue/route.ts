import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        // 1. Aggregate Total Revenue & Commission
        const { data: revenueData } = await supabaseAdmin
            .from('dream_requests')
            .select('locked_price, platform_commission')
            .eq('payment_status', 'paid')
            .eq('status', 'completed');

        let totalRevenue = 0;
        let totalCommission = 0;
        let count = 0;
        
        (revenueData || []).forEach(r => {
            totalRevenue += r.locked_price || 0;
            totalCommission += r.platform_commission || 0;
            count++;
        });

        const stats = { totalRevenue, totalCommission, count };

        // 2. Daily Trends (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentOrders } = await supabaseAdmin
            .from('dream_requests')
            .select('created_at, locked_price, platform_commission')
            .eq('payment_status', 'paid')
            .eq('status', 'completed')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        const dailyMap: Record<string, any> = {};
        (recentOrders || []).forEach(order => {
            const dateObj = new Date(order.created_at);
            const dateStr = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(dateObj.getUTCDate()).padStart(2, '0')}`;
            if (!dailyMap[dateStr]) {
                dailyMap[dateStr] = { _id: dateStr, revenue: 0, commission: 0 };
            }
            dailyMap[dateStr].revenue += order.locked_price || 0;
            dailyMap[dateStr].commission += order.platform_commission || 0;
        });

        const dailyRevenue = Object.values(dailyMap).sort((a, b) => a._id.localeCompare(b._id));

        // 3. Top Performers (Interpreters by generated revenue)
        const { data: humanOrders } = await supabaseAdmin
            .from('dream_requests')
            .select('interpreter_name, locked_price, platform_commission')
            .eq('payment_status', 'paid')
            .eq('status', 'completed')
            .eq('type', 'HUMAN');

        const topMap: Record<string, any> = {};
        (humanOrders || []).forEach(order => {
            const name = order.interpreter_name || 'Unknown';
            if (!topMap[name]) {
                topMap[name] = { _id: name, totalGenerated: 0, commissionEarned: 0, ordersCount: 0 };
            }
            topMap[name].totalGenerated += order.locked_price || 0;
            topMap[name].commissionEarned += order.platform_commission || 0;
            topMap[name].ordersCount += 1;
        });

        const topInterpreters = Object.values(topMap)
            .sort((a, b) => b.totalGenerated - a.totalGenerated)
            .slice(0, 5);

        return NextResponse.json({
            stats,
            dailyRevenue,
            topInterpreters
        });

    } catch (error) {
        console.error('Fetch revenue error:', error);
        return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 });
    }
}
