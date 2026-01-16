import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { generateSlug } from '@/lib/slugify';

export const dynamic = 'force-dynamic';

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

        // Transform data to simple structure with SEO slug
        // Transform data to simple structure with SEO slug (and lazy save)
        const publicDreams = await Promise.all(dreams.map(async d => {
            const id = d._id.toString();
            // Use existing slug or generate new one
            let slug = d.seoSlug;

            if (!slug) {
                slug = generateSlug(
                    d.publicVersion?.title || d.publicVersion?.content || '',
                    d.tags,
                    id
                );
                // Self-healing: Save the generated slug to DB
                try {
                    await Dream.findByIdAndUpdate(d._id, { seoSlug: slug });
                } catch (err) {
                    console.error('Failed to save slug for dream:', id, err);
                }
            }

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
        }));

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

