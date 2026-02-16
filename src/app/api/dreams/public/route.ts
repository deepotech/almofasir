import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dreams/public
 * 
 * Strategy A: Returns seoSlug as the slug field (read-only, no self-healing writes).
 * Old dreams keep their existing seoSlug. New dreams get it at publish time.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '9');

        const skip = (page - 1) * limit;

        const dreams = await Dream.find({
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        })
            .select('publicVersion _id mood createdAt tags seoSlug')
            .sort({ 'publicVersion.publishedAt': -1 })
            .skip(skip)
            .limit(limit);

        const total = await Dream.countDocuments({
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        });

        const publicDreams = dreams.map(d => {
            const id = d._id.toString();
            // Use seoSlug if available, otherwise fall back to id
            const slug = d.seoSlug || id;

            return {
                id,
                slug,
                title: d.publicVersion.title,
                content: d.publicVersion.content,
                interpretation: d.publicVersion.interpretation,
                mood: d.mood,
                tags: d.tags,
                date: d.publicVersion.publishedAt || d.createdAt
            };
        });

        return NextResponse.json({
            dreams: publicDreams,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + dreams.length < total
        });

    } catch (error) {
        console.error('Error fetching public dreams:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
