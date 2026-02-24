import { MetadataRoute } from 'next';
import { dreamSymbols } from '@/data/symbols';
import { interpreters } from '@/lib/interpreters';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';

const BASE_URL = 'https://almofasir.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const currentDate = new Date().toISOString();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/symbols`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/experts`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/interpreted-dreams`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/pricing`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        // Learn section
        {
            url: `${BASE_URL}/learn`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/learn/faq`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/learn/psychology`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/learn/videos`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        // SEO Landing Page
        {
            url: `${BASE_URL}/tafsir-ahlam-mufassirin-haqiqin`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        // Authority Pillar Page
        {
            url: `${BASE_URL}/tafsir-al-ahlam`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];

    // Dynamic symbol pages
    const symbolPages: MetadataRoute.Sitemap = dreamSymbols.map((symbol) => ({
        url: `${BASE_URL}/symbols/${symbol.id}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // Dynamic interpreter pages
    const interpreterKeys = Object.keys(interpreters) as (keyof typeof interpreters)[];
    const interpreterPages: MetadataRoute.Sitemap = interpreterKeys.map((key) => ({
        url: `${BASE_URL}/mufassir/${key}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    // Dynamic Dream Pages (Fetch from DB)
    // URL pattern: /{seoSlug} (matches [dreamSlug] route)
    // Strategy A: seoSlug is the single canonical slug field for ALL dreams.
    let dreamPages: MetadataRoute.Sitemap = [];
    try {
        await dbConnect();
        const dreams = await Dream.find({
            isPublic: true,
            visibilityStatus: 'public',
            seoSlug: { $exists: true, $nin: [null, ''] }
        })
            .select('seoSlug updatedAt publicVersion.publishedAt')
            .sort({ 'publicVersion.publishedAt': -1 })
            .limit(5000)
            .lean();

        dreamPages = dreams.map((dream: any) => {
            const slug = dream.seoSlug;
            const lastMod = dream.publicVersion?.publishedAt
                ? new Date(dream.publicVersion.publishedAt).toISOString()
                : (dream.updatedAt ? new Date(dream.updatedAt).toISOString() : currentDate);

            return {
                // Root-level slug path (matches /[dreamSlug]/page.tsx)
                url: `${BASE_URL}/${slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });

    } catch (error) {
        console.error('Error generating dynamic sitemap for dreams:', error);
    }

    return [...staticPages, ...symbolPages, ...interpreterPages, ...dreamPages];
}
