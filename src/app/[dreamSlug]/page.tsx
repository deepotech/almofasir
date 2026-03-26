
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

const BASE_URL = 'https://almofasir.com';

/**
 * Strategy A: Lookup by seoSlug (single source of truth for URL).
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
 * Fetch related dreams — smart matching by primarySymbol → secondarySymbols → tags → recency.
 */
async function getRelatedDreams(
    currentId: string,
    primarySymbol?: string | null,
    secondarySymbols: string[] = [],
    tags: string[] = [],
    limit = 4
) {
    await dbConnect();

    const baseQuery = {
        _id: { $ne: currentId },
        visibilityStatus: 'public',
        'publicVersion.content': { $exists: true },
    };

    const selectFields = 'publicVersion.title publicVersion.content seoSlug tags publicVersion.comprehensiveInterpretation.primarySymbol';

    // Priority 1: Match by primarySymbol
    if (primarySymbol) {
        const bySymbol = await Dream.find({
            ...baseQuery,
            'publicVersion.comprehensiveInterpretation.primarySymbol': primarySymbol
        })
            .sort({ 'publicVersion.publishedAt': -1 })
            .limit(limit)
            .select(selectFields)
            .lean();

        if (bySymbol.length >= 2) {
            return bySymbol.map((d: any) => ({
                title: d.publicVersion?.title || 'حلم مفسر',
                slug: d.seoSlug || d._id.toString(),
                content: d.publicVersion?.content?.slice(0, 120) || '',
                primarySymbol: d.publicVersion?.comprehensiveInterpretation?.primarySymbol || null,
            }));
        }
    }

    // Priority 2: Match by secondarySymbols or tags
    const symbolsAndTags = [...secondarySymbols, ...tags].filter(Boolean);
    if (symbolsAndTags.length > 0) {
        const byTags = await Dream.find({
            ...baseQuery,
            tags: { $in: symbolsAndTags }
        })
            .sort({ 'publicVersion.publishedAt': -1 })
            .limit(limit)
            .select(selectFields)
            .lean();

        if (byTags.length >= 2) {
            return byTags.map((d: any) => ({
                title: d.publicVersion?.title || 'حلم مفسر',
                slug: d.seoSlug || d._id.toString(),
                content: d.publicVersion?.content?.slice(0, 120) || '',
                primarySymbol: d.publicVersion?.comprehensiveInterpretation?.primarySymbol || null,
            }));
        }
    }

    // Fallback: most recent public dreams
    const recent = await Dream.find(baseQuery)
        .sort({ 'publicVersion.publishedAt': -1 })
        .limit(limit)
        .select(selectFields)
        .lean();

    return recent.map((d: any) => ({
        title: d.publicVersion?.title || 'حلم مفسر',
        slug: d.seoSlug || d._id.toString(),
        content: d.publicVersion?.content?.slice(0, 120) || '',
        primarySymbol: d.publicVersion?.comprehensiveInterpretation?.primarySymbol || null,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ dreamSlug: string }> }): Promise<Metadata> {
    const { dreamSlug } = await params;
    const dream = await getDream(decodeURIComponent(dreamSlug));

    if (!dream) {
        return {
            title: 'الحلم غير موجود - المفسّر',
            description: 'عذراً، لم يتم العثور على هذا الحلم.',
            robots: { index: false, follow: false },
        };
    }

    const comprehensive = (dream as any).publicVersion?.comprehensiveInterpretation;
    const seoTitle = comprehensive?.metaTitle
        || generateSeoTitle(dream.publicVersion?.title, dream.tags, dream.publicVersion?.content || '');
    const metaDescription = comprehensive?.metaDescription
        || generateMetaDescription(dream.publicVersion?.interpretation || '', dream.tags);

    const slug = dream.seoSlug || dream._id.toString();
    const canonicalUrl = `${BASE_URL}/${slug}`;

    return {
        title: `${seoTitle} - المفسّر`,
        description: metaDescription,
        keywords: dream.tags?.join(', '),
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-snippet': -1,
                'max-image-preview': 'large',
            },
        },
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: seoTitle,
            description: metaDescription,
            url: canonicalUrl,
            siteName: 'المفسّر',
            locale: 'ar_SA',
            type: 'article',
            publishedTime: (dream as any).publicVersion?.publishedAt
                ? new Date((dream as any).publicVersion.publishedAt).toISOString()
                : undefined,
            modifiedTime: (dream as any).updatedAt
                ? new Date((dream as any).updatedAt).toISOString()
                : undefined,
            tags: dream.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: metaDescription,
        },
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
    const canonicalUrl = `${BASE_URL}/${slug}`;

    const comprehensive = (dream as any).publicVersion?.comprehensiveInterpretation;
    const seoTitle = comprehensive?.metaTitle
        || generateSeoTitle(dream.publicVersion?.title, dream.tags, dream.publicVersion?.content || '');
    const metaDescription = comprehensive?.metaDescription
        || generateMetaDescription(dream.publicVersion?.interpretation || '', dream.tags);

    const publishedAt = (dream as any).publicVersion?.publishedAt || (dream as any).createdAt;
    const updatedAt = (dream as any).updatedAt || publishedAt;

    // JSON-LD: Article
    const jsonLd = generateArticleSchema({
        title: seoTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        dateModified: updatedAt ? new Date(updatedAt).toISOString() : undefined,
        tags: dream.tags,
    });

    // JSON-LD: Breadcrumbs
    const breadcrumbJsonLd = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: `${BASE_URL}/` },
        { name: 'أحلام مفسرة', url: `${BASE_URL}/interpreted-dreams` },
        { name: seoTitle, url: canonicalUrl },
    ]);

    // JSON-LD: FAQ
    const faqs = (dream as any).publicVersion?.faqs
        ?? comprehensive?.faqs
        ?? [];
    const faqJsonLd = faqs && faqs.length > 0
        ? generateFAQSchema(faqs.map((f: any) => ({ question: f.question, answer: f.answer })))
        : null;

    // Fetch related dreams using smart symbol matching
    const primarySymbol = comprehensive?.primarySymbol ?? null;
    const secondarySymbols = comprehensive?.secondarySymbols ?? [];
    const related = await getRelatedDreams(
        dream._id.toString(),
        primarySymbol,
        secondarySymbols,
        dream.tags,
    );

    // Serialize (plain objects only — no Mongoose documents)
    const serializedDream = JSON.parse(JSON.stringify(dream));

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
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
