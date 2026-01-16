
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import DreamRequest from '@/models/DreamRequest';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();

        // 1. Aggregate Total Revenue & Commission
        const revenueStats = await DreamRequest.aggregate([
            { $match: { paymentStatus: 'paid', status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$lockedPrice' },
                    totalCommission: { $sum: '$platformCommission' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = revenueStats[0] || { totalRevenue: 0, totalCommission: 0, count: 0 };

        // 2. Daily Trends (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyRevenue = await DreamRequest.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    status: 'completed',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: '$lockedPrice' },
                    commission: { $sum: '$platformCommission' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Top Performers (Interpreters by generated revenue)
        const topInterpreters = await DreamRequest.aggregate([
            { $match: { paymentStatus: 'paid', status: 'completed', type: 'HUMAN' } },
            {
                $group: {
                    _id: '$interpreterName',
                    totalGenerated: { $sum: '$lockedPrice' },
                    commissionEarned: { $sum: '$platformCommission' },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: { totalGenerated: -1 } },
            { $limit: 5 }
        ]);

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
