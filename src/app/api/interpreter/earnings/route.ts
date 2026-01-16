import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { verifyIdToken, initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId: string;

        try {
            const decodedToken = await verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            console.error('Auth verify failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Transactions (History)
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 }) // Newest first
            .limit(50) // Limit to 50 for now
            .lean();

        // 3. Calculate Monthly Earnings (for the comparison card)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthEarnings = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'earning',
                    status: 'completed',
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const lastMonthEarnings = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'earning',
                    status: 'completed',
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const thisMonthTotal = currentMonthEarnings[0]?.total || 0;
        const lastMonthTotal = lastMonthEarnings[0]?.total || 0;

        // Calculate percentage change
        let percentageChange = 0;
        if (lastMonthTotal > 0) {
            percentageChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (thisMonthTotal > 0) {
            percentageChange = 100; // 100% increase if last month was 0
        }

        return NextResponse.json({
            transactions: transactions,
            thisMonthTotal,
            lastMonthTotal,
            percentageChange
        });

    } catch (error) {
        console.error('Error fetching interpreter earnings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
