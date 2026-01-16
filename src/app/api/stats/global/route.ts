import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import User from '@/models/User';
import DreamRequest from '@/models/DreamRequest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // 1. Total Requests (All time)
        const totalRequests = await DreamRequest.countDocuments({});

        // 2. Completed Requests (Answered)
        const completedRequests = await DreamRequest.countDocuments({
            status: { $in: ['completed', 'clarification_requested', 'closed'] }
        });

        // 3. Total Revenue (Sum of COMPLETED requests' price)
        // We use an aggregation to sum the 'price' (or 'lockedPrice' if available, assuming price is reliable)
        const revenueAggregation = await DreamRequest.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'clarification_requested', 'closed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$price" }  // Using snapshot price
                }
            }
        ]);

        const totalRevenue = revenueAggregation[0]?.totalAmount || 0;

        return NextResponse.json({
            totalRequests,
            completedRequests,
            totalRevenue,
            usersCount: await User.countDocuments({ role: 'user' }), // Optional extra
            interpretersCount: await User.countDocuments({ role: 'interpreter' }) // Optional extra
        });

    } catch (error) {
        console.error('Error fetching global stats:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
