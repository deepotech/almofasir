
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSlug, generateSeoTitle, generateMetaDescription } from '@/lib/slugify';
import { fallbackDreamDetails, fallbackDreams } from '@/lib/fallbackData';
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, generateDreamListSchema } from '@/lib/seo';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DreamArticle from '@/components/DreamArticle';
import EngagementWidget from '@/components/seo/EngagementWidget';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://almofasir.com';

/**
 * Fetch a public dream by seo_slug (primary) or id (UUID fallback).
 */
async function getDream(slugOrId: string) {
    try {
        // 1. Try seo_slug (canonical URL field)
        const { data: bySlug } = await supabaseAdmin
            .from('dreams')
            .select('*')
            .eq('seo_slug', slugOrId)
            .eq('visibility_status', 'public')
            .not('public_version', 'is', null)
            .single();

        if (bySlug) return bySlug;

        // 2. UUID fallback (backward compat for old bookmarks)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(slugOrId)) {
            const { data: byId } = await supabaseAdmin
                .from('dreams')
                .select('*')
                .eq('id', slugOrId)
                .eq('visibility_status', 'public')
                .not('public_version', 'is', null)
                .single();

            if (byId) return byId;
        }

        return null;
    } catch (e: any) {
        console.error('[Supabase] getDream error:', e?.message);
        return null;
    }
}

/**
 * Fetch related dreams: primarySymbol → secondarySymbols/tags → recency.
 */
async function getRelatedDreams(
    currentId: string,
    primarySymbol?: string | null,
    secondarySymbols: string[] = [],
    tags: string[] = [],
    limit = 4
) {
    const selectFields = 'public_version, seo_slug, tags, id';
    const baseFilter = (q: any) =>
        q
            .neq('id', currentId)
            .eq('visibility_status', 'public')
            .not('public_version', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

    const mapDream = (d: any) => ({
        title: d.public_version?.title || d.public_version?.comprehensiveInterpretation?.metaTitle || 'حلم مفسر',
        slug: d.seo_slug || d.id,
        content: (d.public_version?.content || '').slice(0, 120),
        primarySymbol: d.public_version?.comprehensiveInterpretation?.primarySymbol || null,
    });

    try {
        // Priority 1: match by primarySymbol (stored inside public_version JSONB)
        if (primarySymbol) {
            const { data: bySymbol } = await baseFilter(
                supabaseAdmin
                    .from('dreams')
                    .select(selectFields)
                    .eq('public_version->comprehensiveInterpretation->>primarySymbol', primarySymbol)
            );
            if (bySymbol && bySymbol.length >= 2) return bySymbol.map(mapDream);
        }

        // Priority 2: match by tags overlap
        const symbolsAndTags = [...secondarySymbols, ...tags].filter(Boolean);
        if (symbolsAndTags.length > 0) {
            const { data: byTags } = await baseFilter(
                supabaseAdmin
                    .from('dreams')
                    .select(selectFields)
                    .overlaps('tags', symbolsAndTags)
            );
            if (byTags && byTags.length >= 2) return byTags.map(mapDream);
        }

        // Fallback: most recent public dreams
        const { data: recent } = await baseFilter(
            supabaseAdmin.from('dreams').select(selectFields)
        );
        return (recent ?? []).map(mapDream);
    } catch (e: any) {
        console.error('[Supabase] getRelatedDreams error:', e?.message);
        return fallbackDreams.slice(0, limit).map(d => ({
            title: d.title,
            slug: d.slug,
            content: d.content,
            primarySymbol: 'رمز عام',
        }));
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ dreamSlug: string }>;
}): Promise<Metadata> {
    const { dreamSlug } = await params;
    const dream = await getDream(decodeURIComponent(dreamSlug));

    if (!dream) {
        return {
            title: 'الحلم غير موجود - المفسّر',
            description: 'عذراً، لم يتم العثور على هذا الحلم.',
            robots: { index: false, follow: false },
        };
    }

    const pv = dream.public_version || {};
    const comprehensive = pv.comprehensiveInterpretation || pv.comprehensive_interpretation || {};
    const tags = dream.tags || [];

    const seoTitle =
        comprehensive.metaTitle ||
        comprehensive.meta_title ||
        generateSeoTitle(pv.title, tags, pv.content || '');
    const metaDescription =
        comprehensive.metaDescription ||
        comprehensive.meta_description ||
        generateMetaDescription(pv.interpretation || '', tags);

    const slug = dream.seo_slug || dream.id;
    const canonicalUrl = `${BASE_URL}/${slug}`;

    return {
        title: `${seoTitle} - المفسّر`,
        description: metaDescription,
        keywords: tags.join(', '),
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
        },
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: seoTitle,
            description: metaDescription,
            url: canonicalUrl,
            siteName: 'المفسّر',
            locale: 'ar_SA',
            type: 'article',
            publishedTime: pv.publishedAt || pv.published_at
                ? new Date(pv.publishedAt || pv.published_at).toISOString()
                : undefined,
            modifiedTime: dream.updated_at
                ? new Date(dream.updated_at).toISOString()
                : undefined,
            tags,
        },
        twitter: { card: 'summary_large_image', title: seoTitle, description: metaDescription },
    };
}

export default async function DreamDetailsPage({
    params,
}: {
    params: Promise<{ dreamSlug: string }>;
}) {
    const { dreamSlug } = await params;
    const decodedSlug = decodeURIComponent(dreamSlug);
    const dream = await getDream(decodedSlug);

    if (!dream) notFound();

    const pv = dream.public_version || {};
    const comprehensive = pv.comprehensiveInterpretation || pv.comprehensive_interpretation || {};
    const tags = dream.tags || [];

    const slug = dream.seo_slug || dream.id;
    const canonicalUrl = `${BASE_URL}/${slug}`;

    const seoTitle =
        comprehensive.metaTitle ||
        comprehensive.meta_title ||
        generateSeoTitle(pv.title, tags, pv.content || '');
    const metaDescription =
        comprehensive.metaDescription ||
        comprehensive.meta_description ||
        generateMetaDescription(pv.interpretation || '', tags);

    const publishedAt = pv.publishedAt || pv.published_at || dream.created_at;
    const updatedAt = dream.updated_at || publishedAt;

    // JSON-LD: Article
    const jsonLd = generateArticleSchema({
        title: seoTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        dateModified: updatedAt ? new Date(updatedAt).toISOString() : undefined,
        tags,
    });

    // JSON-LD: Breadcrumbs
    const breadcrumbJsonLd = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: `${BASE_URL}/` },
        { name: 'أحلام مفسرة', url: `${BASE_URL}/interpreted-dreams` },
        { name: seoTitle, url: canonicalUrl },
    ]);

    // JSON-LD: FAQ
    const faqs = pv.faqs ?? comprehensive.faqs ?? [];
    const faqJsonLd =
        faqs && faqs.length > 0
            ? generateFAQSchema(faqs.map((f: any) => ({ question: f.question, answer: f.answer })))
            : null;

    // Related dreams
    const primarySymbol = comprehensive.primarySymbol || comprehensive.primary_symbol || null;
    const secondarySymbols = comprehensive.secondarySymbols || comprehensive.secondary_symbols || [];
    const related = await getRelatedDreams(dream.id, primarySymbol, secondarySymbols, tags);

    // JSON-LD: Related dream list
    const relatedListJsonLd =
        related && related.length > 0
            ? generateDreamListSchema(
                  related.map(r => ({ title: r.title, url: `${BASE_URL}/${r.slug}`, description: r.content || '' })),
                  canonicalUrl
              )
            : null;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            {faqJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            )}
            {relatedListJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedListJsonLd) }} />
            )}
            <Header />
            <main className="min-h-screen pt-24 pb-16">
                <DreamArticle dream={dream} related={related} />
                <div className="container mt-12">
                    <EngagementWidget slug={slug} />
                </div>
            </main>
            <Footer />
        </>
    );
}
