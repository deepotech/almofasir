import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dreams/public
 *
 * Returns publicly visible dreams for /interpreted-dreams listing page.
 * Strategy A: Uses seoSlug as the slug field (read-only).
 */
export async function GET(req: NextRequest) {
    const startTime = Date.now();

    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9');
        const skip = (page - 1) * limit;

        console.log('[DATA DEBUG] /api/dreams/public called', { page, limit, skip });

        // Primary query: dreams with public status and published content
        const query = {
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true, $ne: '' }
        };

        console.log('[DATA DEBUG] Dreams public query:', JSON.stringify(query));

        const dreams = await Dream.find(query)
            .select('publicVersion _id mood createdAt tags seoSlug')
            .sort({ 'publicVersion.publishedAt': -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Dream.countDocuments(query);

        console.log(`[DATA DEBUG] Dreams fetched: ${dreams.length} (page ${page}), total in DB: ${total}`);

        if (dreams.length === 0 && page === 1) {
            // Debug: check what's actually in the DB
            const allCount = await Dream.countDocuments({});
            const publicCount = await Dream.countDocuments({ visibilityStatus: 'public' });
            const withContentCount = await Dream.countDocuments({
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true }
            });
            const visibilityBreakdown = await Dream.aggregate([
                { $group: { _id: '$visibilityStatus', count: { $sum: 1 } } }
            ]);

            console.log('[DATA DEBUG] No public dreams found!', {
                totalDreams: allCount,
                publicDreams: publicCount,
                publicWithContent: withContentCount,
                visibilityBreakdown,
                hint: 'Dreams need visibilityStatus="public" AND publicVersion.content to be visible'
            });
        }

        const publicDreams = dreams.map((d: any) => {
            const id = d._id.toString();
            const slug = d.seoSlug || id;

            // Smart title fallback: publicVersion.title OR comprehensiveInterpretation.h1 OR metaTitle
            const title = d.publicVersion?.title
                || d.publicVersion?.comprehensiveInterpretation?.h1
                || d.publicVersion?.comprehensiveInterpretation?.metaTitle
                || 'حلم مفسر';

            // Smart content fallback
            const content = d.publicVersion?.content
                || d.publicVersion?.comprehensiveInterpretation?.dream_text
                || d.publicVersion?.seoIntro
                || '';

            // Smart interpretation fallback
            const interpretation = d.publicVersion?.interpretation
                || d.publicVersion?.comprehensiveInterpretation?.snippetSummary
                || '';

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
        console.log(`[DATA DEBUG] Dreams public response ready: count=${publicDreams.length}, elapsed=${elapsed}ms`);

        return NextResponse.json({
            success: true,
            dreams: publicDreams,
            count: publicDreams.length,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + dreams.length < total
        });

    } catch (error) {
        console.error('[DATA DEBUG] DB error fetching public dreams:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal Server Error',
                dreams: [],
                count: 0,
                hasMore: false
            },
            { status: 500 }
        );
    }
}
