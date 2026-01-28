import { MetadataRoute } from 'next';
import { dreamSymbols } from '@/data/symbols';
import { interpreters } from '@/lib/interpreters';
import DreamRequest from '@/models/DreamRequest';
import dbConnect from '@/lib/mongodb';
// import Dream from '@/models/Dream'; // Legacy model removed

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
    let dreamPages: MetadataRoute.Sitemap = [];
    try {
        await dbConnect();
        // Fetch last 5000 public dreams
        // Select only necessary fields to reduce payload
        // We use 'status: completed' or 'isPublic: true' depending on your schema.
        // Assuming public dreams are those with `isPublic: true` and `seoSlug`.
        const dreams = await DreamRequest.find({
            isPublic: true,
            status: 'completed',
            seoSlug: { $exists: true, $ne: null }
        })
            .select('seoSlug updatedAt createdAt')
            .sort({ createdAt: -1 })
            .limit(5000)
            .lean();

        dreamPages = dreams.map((dream: any) => {
            const slug = dream.seoSlug;
            // Ensure date string
            const lastMod = dream.updatedAt ? new Date(dream.updatedAt).toISOString() : currentDate;

            return {
                url: `${BASE_URL}/interpreted-dreams/${slug}`, // Correct path
                lastModified: lastMod,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });

    } catch (error) {
        console.error('Error generating dynamic sitemap for dreams:', error);
        // Continue with static pages even if DB fails
    }

    return [...staticPages, ...symbolPages, ...interpreterPages, ...dreamPages];
}
