import { NextRequest, NextResponse } from 'next/server';
import { withDbRetry } from '@/lib/mongodb';
import Interpreter from '@/models/Interpreter';
import { getCachedOrFallback, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/interpreters - List all active interpreters
export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const sortBy = searchParams.get('sort') || 'rating';
    const includeAll = searchParams.get('includeAll') === 'true';

    const cacheKey = `interpreters_t${type}_s${sortBy}_i${includeAll}`;

    try {
        console.log('[DATA DEBUG] /api/interpreters called', { type, sortBy, includeAll });

        const interpreters = await withDbRetry(async () => {
            const query: Record<string, unknown> = { status: { $ne: 'suspended' } };

            if (!includeAll) {
                query.isActive = true;
                query.displayName = { $nin: ['HICHAM EL MORSLI', 'مفسر تجريبي', 'Test Interpreter'] };
            }

            if (type !== 'all' && ['religious', 'psychological', 'symbolic', 'mixed'].includes(type as string)) {
                query.interpretationType = type;
            }

            let sort: Record<string, 1 | -1> = { rating: -1 };
            if (sortBy === 'price') sort = { price: 1 };
            else if (sortBy === 'responseTime') sort = { responseTime: 1 };
            else if (sortBy === 'dreams') sort = { completedDreams: -1 };

            return Interpreter.find(query)
                .select('-earnings -pendingEarnings -userId')
                .sort(sort)
                .lean();
        }, 2, 5000); // 2 retries, 5 seconds timeout


        console.log(`[DATA DEBUG] Interpreters fetched: ${interpreters.length} records`);

        const formatted = interpreters.map((interpreter: any) => ({
            id: interpreter._id,
            displayName: interpreter.displayName,
            avatar: interpreter.avatar,
            bio: interpreter.bio,
            interpretationType: interpreter.interpretationType,
            interpretationTypeAr: getTypeArabic(interpreter.interpretationType),
            price: interpreter.price,
            responseTime: interpreter.responseTime,
            responseTimeText: getResponseTimeText(interpreter.responseTime),
            rating: interpreter.rating || 0,
            totalRatings: interpreter.totalRatings || 0,
            completedDreams: interpreter.completedDreams || 0,
            isActive: interpreter.isActive,
            status: interpreter.status
        }));

        const elapsed = Date.now() - startTime;
        console.log(`[DATA DEBUG] ✅ Interpreters response: ${formatted.length}, ${elapsed}ms`);

        const responseData = {
            count: formatted.length,
            interpreters: formatted,
            total: formatted.length
        };

        setCache(cacheKey, responseData, 3600); // cache for 1 hour

        return NextResponse.json({
            success: true,
            ...responseData
        });

    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[DB ERROR] ❌ /api/interpreters — Failed completely (${elapsed}ms):`, error?.message);

        // Ultimate Resiliency: Return Cache or Mock Data!
        const fallbackResponse = getCachedOrFallback(cacheKey, 'interpreters');

        return NextResponse.json({
            success: true,
            ...fallbackResponse
        });
    }
}

// Helper functions
function getTypeArabic(type: string): string {
    const types: Record<string, string> = {
        'religious': 'شرعي',
        'psychological': 'نفسي',
        'symbolic': 'رمزي',
        'mixed': 'شامل'
    };
    return types[type] || 'شامل';
}

function getResponseTimeText(hours: number): string {
    if (hours <= 6) return 'خلال 6 ساعات';
    if (hours <= 24) return 'خلال 24 ساعة';
    if (hours <= 48) return 'خلال 48 ساعة';
    if (hours <= 72) return 'خلال 3 أيام';
    return `خلال ${Math.ceil(hours / 24)} أيام`;
}
