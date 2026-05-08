import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCachedOrFallback, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const searchParams = req.nextUrl.searchParams;
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const from  = (page - 1) * limit;
    const cacheKey = `public_dreams_p${page}_l${limit}`;

    try {
        const { data: rows, error, count } = await supabaseAdmin
            .from('dreams')
            .select('id, seo_slug, mood, created_at, tags, public_version', { count: 'exact' })
            .eq('visibility_status', 'public')
            .not('public_version', 'is', null)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;

        const dreams = (rows ?? []).map((d: any) => {
            const pv = d.public_version || {};
            return {
                id:             d.id,
                slug:           d.seo_slug || d.id,
                title:          pv.title || pv.comprehensiveInterpretation?.metaTitle || 'حلم مفسر',
                content:        pv.content || pv.seoIntro || '',
                interpretation: pv.interpretation || pv.comprehensiveInterpretation?.snippetSummary || '',
                mood:           d.mood || 'neutral',
                tags:           d.tags || [],
                date:           pv.publishedAt || d.created_at,
            };
        });

        const total = count ?? 0;
        const responseData = {
            dreams,
            count:      dreams.length,
            currentPage: page,
            totalPages:  Math.ceil(total / limit),
            hasMore:     from + dreams.length < total,
        };

        setCache(cacheKey, responseData, 3600);
        console.log(`[/api/dreams/public] ${dreams.length} dreams in ${Date.now() - startTime}ms`);

        return NextResponse.json({ success: true, ...responseData });

    } catch (error: any) {
        console.error('[/api/dreams/public] Error:', error?.message);
        const fallback = await getCachedOrFallback(cacheKey, 'dreams');
        return NextResponse.json({ success: true, ...fallback });
    }
}
