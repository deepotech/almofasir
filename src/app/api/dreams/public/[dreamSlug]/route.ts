import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { generateSlug, extractIdFromSlug, isMongoId } from '@/lib/slugify';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dreamSlug: string }> }
) {
    try {
        await dbConnect();
        const { dreamSlug: slugOrId } = await params;

        let dream;

        // Check if it's a raw MongoDB ID or a SEO slug
        if (isMongoId(slugOrId)) {
            // Direct ID lookup
            dream = await Dream.findOne({
                _id: slugOrId,
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true }
            }).select('publicVersion tags mood createdAt seoSlug');
        } else {
            // Slug-based lookup: first try seoSlug field
            dream = await Dream.findOne({
                seoSlug: slugOrId,
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true }
            }).select('publicVersion tags mood createdAt seoSlug');

            // If not found, try extracting ID from slug
            if (!dream) {
                const extractedId = extractIdFromSlug(slugOrId);
                if (extractedId) {
                    // Find by partial ID match (last 6 chars)
                    dream = await Dream.findOne({
                        visibilityStatus: 'public',
                        'publicVersion.content': { $exists: true }
                    }).where('_id').regex(new RegExp(`${extractedId}$`, 'i'))
                        .select('publicVersion tags mood createdAt seoSlug');
                }
            }
        }

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        const id = dream._id.toString();
        const slug = dream.seoSlug || generateSlug(
            dream.publicVersion?.title || dream.publicVersion?.content || '',
            dream.tags,
            id
        );

        // Update seoSlug if it doesn't exist
        if (!dream.seoSlug) {
            await Dream.findByIdAndUpdate(id, { seoSlug: slug });
        }

        return NextResponse.json({
            id,
            slug,
            title: dream.publicVersion.title,
            content: dream.publicVersion.content,
            interpretation: dream.publicVersion.interpretation,
            mood: dream.mood,
            tags: dream.tags,
            date: dream.publicVersion.publishedAt || dream.createdAt
        });

    } catch (error) {
        console.error('Error fetching public dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

