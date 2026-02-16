
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { generateSlug, isMongoId, generateSeoTitle, generateMetaDescription } from '@/lib/slugify';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';
import DreamDetailsContent from '@/components/DreamDetailsContent';

export const dynamic = 'force-dynamic';

/**
 * Strategy A: Lookup by seoSlug (single source of truth for URL).
 * - Old dreams have their original seoSlug (kept as-is).
 * - New dreams get a clean slugifyArabic-generated seoSlug at publish time.
 * - No redirects, no previousSlugs lookups.
 * - Fallback: lookup by MongoDB _id for backward compatibility.
 */
async function getDream(slugOrId: string) {
    await dbConnect();

    // 1. Try seoSlug (primary — this is the canonical URL field)
    let dream = await Dream.findOne({
        seoSlug: slugOrId,
        visibilityStatus: 'public',
        'publicVersion.content': { $exists: true }
    }).lean();

    if (dream) return dream;

    // 2. Fallback: direct Mongo _id lookup (backward compat for old bookmarks)
    if (isMongoId(slugOrId)) {
        dream = await Dream.findOne({
            _id: slugOrId,
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        }).lean();
        if (dream) return dream;
    }

    return null;
}

export async function generateMetadata({ params }: { params: Promise<{ dreamSlug: string }> }): Promise<Metadata> {
    const { dreamSlug } = await params;
    const dream = await getDream(decodeURIComponent(dreamSlug));

    if (!dream) {
        return {
            title: 'الحلم غير موجود - المفسّر',
            description: 'عذراً، لم يتم العثور على هذا الحلم.'
        };
    }

    const seoTitle = generateSeoTitle(
        dream.publicVersion?.title,
        dream.tags,
        dream.publicVersion?.content || ''
    );

    const metaDescription = generateMetaDescription(
        dream.publicVersion?.interpretation || '',
        dream.tags
    );

    // Use seoSlug as the canonical slug (single source of truth)
    const slug = dream.seoSlug || dream._id.toString();
    const canonicalUrl = `https://almofasir.com/${slug}`;

    return {
        title: `${seoTitle} - المفسّر`,
        description: metaDescription,
        keywords: dream.tags?.join(', '),
        alternates: {
            canonical: canonicalUrl
        },
        openGraph: {
            title: seoTitle,
            description: metaDescription,
            url: canonicalUrl,
            siteName: 'المفسّر',
            locale: 'ar_SA',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: metaDescription,
        }
    };
}

export default async function DreamDetailsPage({ params }: { params: Promise<{ dreamSlug: string }> }) {
    const { dreamSlug } = await params;
    const decodedSlug = decodeURIComponent(dreamSlug);

    const dream = await getDream(decodedSlug);

    if (!dream) {
        notFound();
    }

    const slug = dream.seoSlug || dream._id.toString();
    const canonicalUrl = `https://almofasir.com/${slug}`;
    const seoTitle = generateSeoTitle(
        dream.publicVersion?.title,
        dream.tags,
        dream.publicVersion?.content || ''
    );
    const metaDescription = generateMetaDescription(
        dream.publicVersion?.interpretation || '',
        dream.tags
    );

    const jsonLd = generateArticleSchema({
        title: seoTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished: (dream.publicVersion?.publishedAt || dream.createdAt)?.toISOString(),
        tags: dream.tags
    });

    const breadcrumbJsonLd = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://almofasir.com/' },
        { name: 'أحلام مفسرة', url: 'https://almofasir.com/interpreted-dreams' },
        { name: seoTitle, url: canonicalUrl }
    ]);

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {breadcrumbJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                />
            )}
            <DreamDetailsContent id={slug} />
        </>
    );
}
