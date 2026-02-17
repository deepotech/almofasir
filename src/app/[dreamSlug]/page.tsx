
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { generateSlug, isMongoId, generateSeoTitle, generateMetaDescription } from '@/lib/slugify';
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DreamArticle from '@/components/DreamArticle';

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

/**
 * Fetch related/recent public dreams (excluding the current one).
 */
async function getRelatedDreams(currentId: string, tags: string[] = [], limit = 4) {
    await dbConnect();

    // Try to find dreams with matching tags first
    let related = await Dream.find({
        _id: { $ne: currentId },
        visibilityStatus: 'public',
        'publicVersion.content': { $exists: true },
        ...(tags.length > 0 ? { tags: { $in: tags } } : {})
    })
        .sort({ 'publicVersion.publishedAt': -1 })
        .limit(limit)
        .select('publicVersion.title publicVersion.content seoSlug tags')
        .lean();

    // Fallback to recent dreams if no tag matches
    if (related.length === 0 && tags.length > 0) {
        related = await Dream.find({
            _id: { $ne: currentId },
            visibilityStatus: 'public',
            'publicVersion.content': { $exists: true }
        })
            .sort({ 'publicVersion.publishedAt': -1 })
            .limit(limit)
            .select('publicVersion.title publicVersion.content seoSlug tags')
            .lean();
    }

    return related.map((d: any) => ({
        title: d.publicVersion?.title || 'حلم مفسر',
        slug: d.seoSlug || d._id.toString(),
        content: d.publicVersion?.content?.slice(0, 120) || ''
    }));
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

    // Prefer AI-generated meta from comprehensiveInterpretation
    const comprehensive = (dream as any).publicVersion?.comprehensiveInterpretation;
    const seoTitle = comprehensive?.metaTitle
        || generateSeoTitle(dream.publicVersion?.title, dream.tags, dream.publicVersion?.content || '');
    const metaDescription = comprehensive?.metaDescription
        || generateMetaDescription(dream.publicVersion?.interpretation || '', dream.tags);

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

    // Prefer AI-generated meta
    const comprehensive = (dream as any).publicVersion?.comprehensiveInterpretation;
    const seoTitle = comprehensive?.metaTitle
        || generateSeoTitle(dream.publicVersion?.title, dream.tags, dream.publicVersion?.content || '');
    const metaDescription = comprehensive?.metaDescription
        || generateMetaDescription(dream.publicVersion?.interpretation || '', dream.tags);

    // JSON-LD: Article
    const jsonLd = generateArticleSchema({
        title: seoTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished: (dream.publicVersion?.publishedAt || dream.createdAt)?.toISOString(),
        tags: dream.tags
    });

    // JSON-LD: Breadcrumbs
    const breadcrumbJsonLd = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://almofasir.com/' },
        { name: 'أحلام مفسرة', url: 'https://almofasir.com/interpreted-dreams' },
        { name: seoTitle, url: canonicalUrl }
    ]);

    // JSON-LD: FAQ
    const faqs = dream.publicVersion?.faqs;
    const faqJsonLd = faqs && faqs.length > 0
        ? generateFAQSchema(faqs.map((f: any) => ({ question: f.question, answer: f.answer })))
        : null;

    // Fetch related dreams
    const related = await getRelatedDreams(dream._id.toString(), dream.tags);

    // Serialize the dream for the client component
    const serializedDream = JSON.parse(JSON.stringify(dream));

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
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}
            <Header />
            <main className="min-h-screen pt-24 pb-16">
                <DreamArticle dream={serializedDream} related={related} />
            </main>
            <Footer />
        </>
    );
}
