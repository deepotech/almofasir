import { MetadataRoute } from 'next';
import { getAllSymbols } from '@/lib/symbolsData';
import { interpreters } from '@/lib/interpreters';
import { supabaseAdmin } from '@/lib/supabase';

const BASE_URL = 'https://almofasir.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const currentDate = new Date().toISOString();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/symbols`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE_URL}/experts`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/interpreted-dreams`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/about`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/pricing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/privacy`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/terms`, lastModified: currentDate, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/learn`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/learn/faq`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/learn/psychology`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/learn/videos`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.6 },
        { url: `${BASE_URL}/tafsir-ahlam-mufassirin-haqiqin`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/learn/articles`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/learn/articles/car-dream-interpretation`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/learn/articles/hugging-dead-dream-interpretation`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/tafsir-al-ahlam`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE_URL}/booking`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/consult-expert`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/join`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    ];

    // Dynamic symbol pages (Hybrid: DB + Static fallback)
    const symbols = await getAllSymbols();
    const symbolPages: MetadataRoute.Sitemap = symbols.map((symbol) => ({
        url: `${BASE_URL}/symbols/${symbol.id}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
    }));

    // Dynamic interpreter pages (from static config)
    const interpreterKeys = Object.keys(interpreters) as (keyof typeof interpreters)[];
    const interpreterPages: MetadataRoute.Sitemap = interpreterKeys.map((key) => ({
        url: `${BASE_URL}/mufassir/${key}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    // Dynamic Dream Pages — fetched from Supabase
    let dreamPages: MetadataRoute.Sitemap = [];
    try {
        const { data: dreams, error } = await supabaseAdmin
            .from('dreams')
            .select('seo_slug, updated_at, public_version')
            .eq('is_public', true)
            .eq('visibility_status', 'public')
            .not('seo_slug', 'is', null)
            .neq('seo_slug', '')
            .order('created_at', { ascending: false })
            .limit(5000);

        if (error) throw error;

        dreamPages = (dreams ?? []).map((dream: any) => {
            const pv = dream.public_version || {};
            const lastMod = pv.published_at || pv.publishedAt
                ? new Date(pv.published_at || pv.publishedAt).toISOString()
                : (dream.updated_at ? new Date(dream.updated_at).toISOString() : currentDate);

            return {
                url: `${BASE_URL}/${dream.seo_slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });

        console.log(`[Sitemap] Generated ${dreamPages.length} dream pages`);
    } catch (error) {
        console.error('[Sitemap] Error generating dynamic dream pages:', error);
    }

    return [...staticPages, ...symbolPages, ...interpreterPages, ...dreamPages];
}
