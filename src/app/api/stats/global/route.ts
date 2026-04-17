import { NextResponse } from 'next/server';
import { withDbRetry } from '@/lib/mongodb';
import Dream from '@/models/Dream';
import User from '@/models/User';
import DreamRequest from '@/models/DreamRequest';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'global_stats';
const CACHE_TTL = 30 * 60; // 30 minutes

/** Safe fallback stats returned when DB is unreachable */
const FALLBACK_STATS = {
    totalRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    dreamsCount: 0,
    usersCount: 0,
    interpretersCount: 0,
    isFromFallback: true,
};

export async function GET() {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
        console.log('[STATS] Serving from cache');
        return NextResponse.json({ ...cached, isFromCache: true });
    }

    try {
        // 2. Fetch all stats with retry + timeout protection
        const stats = await withDbRetry(async () => {
            const [
                totalRequests,
                completedRequests,
                revenueAggregation,
                dreamsCount,
                usersCount,
                interpretersCount,
            ] = await Promise.all([
                DreamRequest.countDocuments({}),
                DreamRequest.countDocuments({
                    status: { $in: ['completed', 'clarification_requested', 'closed'] }
                }),
                DreamRequest.aggregate([
                    {
                        $match: {
                            status: { $in: ['completed', 'clarification_requested', 'closed'] }
                        }
                    },
                    { $group: { _id: null, totalAmount: { $sum: '$price' } } }
                ]),
                Dream.countDocuments({}),
                User.countDocuments({ role: 'user' }),
                User.countDocuments({ role: 'interpreter' }),
            ]);

            return {
                totalRequests,
                completedRequests,
                totalRevenue: revenueAggregation[0]?.totalAmount || 0,
                dreamsCount,
                usersCount,
                interpretersCount,
            };
        }, 2, 5000);

        // 3. Cache the successful result
        setCache(CACHE_KEY, stats, CACHE_TTL);
        console.log('[STATS] ✅ Fetched and cached global stats');

        return NextResponse.json(stats);

    } catch (error: any) {
        console.error('[STATS] ❌ DB failed — returning fallback stats:', error?.message);

        // 4. Ultimate fallback — return zeros so the homepage never crashes
        return NextResponse.json(FALLBACK_STATS);
    }
}

