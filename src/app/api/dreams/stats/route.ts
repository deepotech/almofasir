
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let userId;

        try {
            const decodedToken = await getAuth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (authError) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Auth verification failed, falling back to insecure decoding for development.');
                try {
                    // Insecure fallback for dev only: decode token payload without verification
                    const payload = token.split('.')[1];
                    const decodedValue = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
                    userId = decodedValue.user_id || decodedValue.sub;
                    if (!userId) throw new Error('No user_id in token');
                } catch (decodeError) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 2. Aggregations
        // Total Dreams
        const totalDreams = await Dream.countDocuments({ userId });

        // Mood Stats
        const moodStats = await Dream.aggregate([
            { $match: { userId } },
            { $group: { _id: '$mood', count: { $sum: 1 } } }
        ]);

        // Interpreter Stats
        const interpreterStats = await Dream.aggregate([
            { $match: { userId } },
            { $group: { _id: '$interpreter', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Dreams Over Time (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const timelineStats = await Dream.aggregate([
            {
                $match: {
                    userId,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            totalDreams,
            moods: moodStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            interpreters: interpreterStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            topInterpreter: interpreterStats[0]?._id || null,
            timeline: timelineStats
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
