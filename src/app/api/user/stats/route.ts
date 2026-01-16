import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DreamRequest from '@/models/DreamRequest';
import User from '@/models/User';
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

        // 2. Fetch User Data (Single Source of Truth)
        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Calculate Daily Free Status
        const now = new Date();
        const lastFree = user.lastFreeDreamAt ? new Date(user.lastFreeDreamAt) : null;

        let isDailyFreeAvailable = true;
        let nextFreeAt: Date | null = null;

        if (lastFree) {
            const lastFreeDate = new Date(lastFree);
            const isSameDay = lastFreeDate.getUTCFullYear() === now.getUTCFullYear() &&
                lastFreeDate.getUTCMonth() === now.getUTCMonth() &&
                lastFreeDate.getUTCDate() === now.getUTCDate();

            if (isSameDay) {
                isDailyFreeAvailable = false;
                // Next free at midnight UTC tomorrow
                const tomorrow = new Date();
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                tomorrow.setUTCHours(0, 0, 0, 0);
                nextFreeAt = tomorrow;
            }
        }

        // 4. Aggregations (Keep existing logic but ensure efficiency)
        const [totalRequests, pendingRequests, completedRequests, totalSpentAgg] = await Promise.all([
            DreamRequest.countDocuments({ userId }),
            DreamRequest.countDocuments({ userId, status: { $in: ['new', 'pending', 'in_progress', 'assigned'] } }),
            DreamRequest.countDocuments({ userId, status: { $in: ['completed', 'answered', 'closed'] } }),
            DreamRequest.aggregate([
                { $match: { userId } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ])
        ]);

        const totalSpent = totalSpentAgg[0]?.total || 0;

        return NextResponse.json({
            // Identity & Plan
            plan: user.plan || 'free',
            credits: user.credits || 0,

            // Daily Limit Status
            isDailyFreeAvailable,
            nextFreeAt,

            // Stats
            totalRequests,
            pendingRequests,
            completedRequests,
            totalSpent
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
