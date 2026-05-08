import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMongoId } from '@/lib/slugify';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dreamSlug: string }> }
) {
    try {
        const { dreamSlug: slugOrId } = await params;

        let query = supabaseAdmin
            .from('dreams')
            .select('id, seo_slug, mood, created_at, tags, public_version')
            .eq('visibility_status', 'public')
            .not('public_version->content', 'is', null);

        // UUID lookup (backward compat) vs slug lookup
        if (isMongoId(slugOrId)) {
            query = query.eq('id', slugOrId);
        } else {
            query = query.eq('seo_slug', slugOrId);
        }

        const { data: dream, error } = await query.single();

        if (error || !dream) {
            return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
        }

        const pv = dream.public_version || {};

        return NextResponse.json({
            id:    dream.id,
            slug:  dream.seo_slug || dream.id,
            title: pv.title,
            content: pv.content,
            interpretation: pv.interpretation,
            structuredInterpretation: pv.structuredInterpretation,
            comprehensiveInterpretation: pv.comprehensiveInterpretation,
            seoIntro: pv.seoIntro,
            faqs: pv.faqs,
            mood: dream.mood,
            tags: dream.tags,
            date: pv.publishedAt || dream.created_at,
            publicVersion: {
                title:                      pv.title,
                content:                    pv.content,
                seoIntro:                   pv.seoIntro,
                interpretation:             pv.interpretation,
                structuredInterpretation:   pv.structuredInterpretation,
                comprehensiveInterpretation:pv.comprehensiveInterpretation,
                faqs:                       pv.faqs,
                publishDate:                pv.publishedAt || dream.created_at,
                keywords:                   dream.tags,
            },
        });

    } catch (error) {
        console.error('Error fetching public dream:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
