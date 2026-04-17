import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { withDbRetry } from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { getCachedOrFallback, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dreams/public
 *
 * Returns publicly visible dreams for /interpreted-dreams listing page.
 * Completely resilient to MongoDB outages with ZERO blank UI.
 */
export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const skip = (page - 1) * limit;

    const cacheKey = `public_dreams_p${page}_l${limit}`;

    try {
        // Step 1: Execute Query with Retries and Timeout bounds
        const [dreams, total] = await withDbRetry(async () => {
            const query = {
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true, $ne: '' }
            };

            const [dreamsQuery, totalQuery] = await Promise.all([
                Dream.find(query)
                    .select('publicVersion _id mood createdAt tags seoSlug')
                    .sort({ 'publicVersion.publishedAt': -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Dream.countDocuments(query)
            ]);
            return [dreamsQuery, totalQuery];
        }, 2, 5000); // 2 retries, 5 sec timeout per attempt

        console.log(`[DATA DEBUG] Dreams fetched: ${dreams.length} / total: ${total}`);

        const publicDreams = dreams.map((d: any) => {
            const id = d._id.toString();
            const slug = d.seoSlug || id;
            const title =
                d.publicVersion?.title ||
                d.publicVersion?.comprehensiveInterpretation?.h1 ||
                d.publicVersion?.comprehensiveInterpretation?.metaTitle ||
                'حلم مفسر';
            const content =
                d.publicVersion?.content ||
                d.publicVersion?.comprehensiveInterpretation?.dream_text ||
                d.publicVersion?.seoIntro ||
                '';
            const interpretation =
                d.publicVersion?.interpretation ||
                d.publicVersion?.comprehensiveInterpretation?.snippetSummary ||
                '';
            return {
                id,
                slug,
                title,
                content,
                interpretation,
                mood: d.mood || 'neutral',
                tags: d.tags || [],
                date: d.publicVersion?.publishedAt || d.createdAt
            };
        });

        const elapsed = Date.now() - startTime;
        console.log(`[DATA DEBUG] ✅ Response ready: ${publicDreams.length} dreams, ${elapsed}ms`);

        const responseData = {
            dreams: publicDreams,
            count: publicDreams.length,
            currentPage: page,
            totalPages: Math.ceil((total as number) / limit),
            hasMore: skip + dreams.length < (total as number)
        };

        // Cache the successful response
        setCache(cacheKey, responseData, 3600); // Cache for 1 hour

        return NextResponse.json({
            success: true,
            ...responseData
        });

    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[DB ERROR] ❌ /api/dreams/public — Failed completely (${elapsed}ms):`, error?.message);

        // Ultimate Resiliency: Return Cache or Mock Data!
        const fallbackResponse = await getCachedOrFallback(cacheKey, 'dreams');

        return NextResponse.json({
            success: true,
            ...fallbackResponse
        });
    }
}
