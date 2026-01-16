
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import DreamRequest from '@/models/DreamRequest';
import Interpreter from '@/models/Interpreter';
import PlatformSettings, { getSettings } from '@/models/PlatformSettings';
import dbConnect from '@/lib/mongodb';
import { STUCK_ORDER_THRESHOLD_HOURS } from '@/lib/constants';

// Force dynamic route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Protection
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        await dbConnect();

        // 2. Date ranges
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        // 3. Parallel Queries for Performance
        const [
            dreamsToday,
            paidOrdersToday,
            paidOrdersWeek,
            revenueAgg,
            activeInterpreters,
            pendingOrders,
            aiFailures,
            settings
        ] = await Promise.all([
            // Total Dreams Today (AI + HUMAN) - Created today, not cancelled
            DreamRequest.countDocuments({
                createdAt: { $gte: todayStart },
                status: { $ne: 'cancelled' }
            }),

            // Paid Orders Today - Strictly 'paid' status
            DreamRequest.countDocuments({
                createdAt: { $gte: todayStart },
                paymentStatus: 'paid'
            }),

            // Paid Orders Week
            DreamRequest.countDocuments({
                createdAt: { $gte: weekStart },
                paymentStatus: 'paid'
            }),

            // Real Revenue & Commission (ALL Paid Orders, regardless of completion status)
            DreamRequest.aggregate([
                { $match: { paymentStatus: 'paid' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$lockedPrice' },
                        platformCommission: { $sum: '$platformCommission' },
                        // Interpreter earnings = Total - Commission (roughly, or sum explicit field if populated)
                        // If interpreterEarning is only populated on completion, we might rely on math here for pending:
                        // But strictly: lockedPrice - platformCommission is the "net" money in system that isn't platform fee.
                        interpreterEarning: { $sum: { $subtract: ['$lockedPrice', '$platformCommission'] } }
                    }
                }
            ]),

            // Active Interpreters (Strict: status active AND activity in last 24h)
            Interpreter.countDocuments({
                status: 'active',
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),

            // Pending/Stuck Orders (new > Threshold) OR (in_progress > Threshold)
            // STRICT: Needs action if it's new/assigned for too long
            DreamRequest.countDocuments({
                $or: [
                    {
                        status: 'new',
                        createdAt: { $lt: new Date(Date.now() - STUCK_ORDER_THRESHOLD_HOURS * 60 * 60 * 1000) }
                    },
                    {
                        status: 'assigned',
                        updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Assigned > 24h ago
                    }
                ]
            }),

            // AI Failures
            DreamRequest.countDocuments({
                type: 'AI',
                status: 'cancelled',
                createdAt: { $gte: weekStart }
            }),

            getSettings()
        ]);

        const revenueData = revenueAgg[0] || { totalRevenue: 0, platformCommission: 0 };

        return NextResponse.json({
            dreamsToday,
            paidOrdersToday,
            paidOrdersWeek,
            totalRevenue: revenueData.totalRevenue,
            platformCommission: revenueData.platformCommission,
            activeInterpreters,
            pendingOrders,
            aiFailures,
            commissionRate: settings.commissionRate
        });

    } catch (error) {
        console.error('Stats overview error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
