import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { generateSlug, extractIdFromSlug, isMongoId, generateSeoTitle, generateMetaDescription } from '@/lib/slugify';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';
import DreamDetailsContent from '@/components/DreamDetailsContent';

// Helper to fetch dream by slug or ID
async function getDream(slugOrId: string) {
    await dbConnect();

    let dream;

    if (isMongoId(slugOrId)) {
        dream = await Dream.findOne({
            _id: slugOrId,
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        }).lean();
    } else {
        dream = await Dream.findOne({
            seoSlug: slugOrId,
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        }).lean();

        if (!dream) {
            const extractedId = extractIdFromSlug(slugOrId);
            if (extractedId) {
                const dreams = await Dream.find({
                    visibilityStatus: 'public',
                    'publicVersion.content': { $exists: true }
                }).lean();

                dream = dreams.find(d =>
                    d._id.toString().endsWith(extractedId)
                );
            }
        }
    }

    return dream;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ dreamSlug: string }> }): Promise<Metadata> {
    const { dreamSlug } = await params;
    const dream = await getDream(dreamSlug);

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

    const slug = dream.seoSlug || generateSlug(
        dream.publicVersion?.title || dream.publicVersion?.content || '',
        dream.tags,
        dream._id.toString()
    );

    const canonicalUrl = `https://almofasser.com/${slug}`;

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
    const dream = await getDream(dreamSlug);

    // Generate JSON-LD structured data
    let jsonLd = null;
    let breadcrumbJsonLd = null;

    if (dream) {
        const slug = dream.seoSlug || generateSlug(
            dream.publicVersion?.title || dream.publicVersion?.content || '',
            dream.tags || [],
            dream._id.toString()
        );

        const canonicalUrl = `https://almofasser.com/${slug}`;
        const seoTitle = generateSeoTitle(
            dream.publicVersion?.title,
            dream.tags,
            dream.publicVersion?.content || ''
        );
        const metaDescription = generateMetaDescription(
            dream.publicVersion?.interpretation || '',
            dream.tags
        );

        jsonLd = generateArticleSchema({
            title: seoTitle,
            description: metaDescription,
            url: canonicalUrl,
            datePublished: (dream.publicVersion?.publishedAt || dream.createdAt)?.toISOString(),
            tags: dream.tags
        });

        breadcrumbJsonLd = generateBreadcrumbSchema([
            { name: 'الرئيسية', url: 'https://almofasser.com/' },
            { name: 'أحلام مفسرة', url: 'https://almofasser.com/interpreted-dreams' }, // Keep this parent? Yes.
            { name: seoTitle, url: canonicalUrl }
        ]);
    }

    return (
        <>
            {/* JSON-LD Structured Data */}
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

            <DreamDetailsContent id={dreamSlug} />
        </>
    );
}
