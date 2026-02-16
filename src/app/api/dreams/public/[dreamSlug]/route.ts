import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { isMongoId } from '@/lib/slugify';

/**
 * GET /api/dreams/public/[dreamSlug]
 * 
 * Strategy A: Lookup by seoSlug (single field, no migration, no self-healing writes).
 * Fallback to _id for backward compatibility.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dreamSlug: string }> }
) {
    try {
        await dbConnect();
        const { dreamSlug: slugOrId } = await params;

        let dream;

        if (isMongoId(slugOrId)) {
            // Direct ID lookup (backward compat)
            dream = await Dream.findOne({
                _id: slugOrId,
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true }
            }).select('publicVersion tags mood createdAt seoSlug');
        } else {
            // Slug-based lookup: seoSlug field
            dream = await Dream.findOne({
                seoSlug: slugOrId,
                visibilityStatus: 'public',
                'publicVersion.content': { $exists: true }
            }).select('publicVersion tags mood createdAt seoSlug');
        }

        if (!dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        const id = dream._id.toString();
        const slug = dream.seoSlug || id;

        return NextResponse.json({
            id,
            slug,
            title: dream.publicVersion.title,
            content: dream.publicVersion.content,
            interpretation: dream.publicVersion.interpretation,
            structuredInterpretation: dream.publicVersion.structuredInterpretation,
            seoIntro: dream.publicVersion.seoIntro,
            faqs: dream.publicVersion.faqs,
            mood: dream.mood,
            tags: dream.tags,
            date: dream.publicVersion.publishedAt || dream.createdAt
        });

    } catch (error) {
        console.error('Error fetching public dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
