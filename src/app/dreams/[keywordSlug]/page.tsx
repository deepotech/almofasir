import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import dbConnect from '@/lib/mongodb';
import ProgrammaticPage from '@/models/ProgrammaticPage';
import Dream from '@/models/Dream';
import { openRouter } from '@/lib/openrouter';
import { generateArticleSchema, generateBreadcrumbSchema, generateDreamListSchema } from '@/lib/seo';
import EngagementWidget from '@/components/seo/EngagementWidget';
import Link from 'next/link';
import { renderTextWithBoldAndLinks } from '@/lib/internalLinking';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ keywordSlug: string }>;
}

const unslugify = (slug: string) => slug.replace(/-/g, ' ');

// Match long-tail tokens to existing DB dreams
async function getAggregatedDreams(slug: string) {
    const tokens = unslugify(slug).split(' ');
    // Exclude common stop words
    const stopWords = ['تفسير', 'حلم', 'رؤية', 'في', 'المنام', 'للرجل', 'للمرأة', 'للعزباء', 'للمتزوجة'];
    const keywords = tokens.filter(t => !stopWords.includes(t));
    
    if (keywords.length === 0) return [];

    await dbConnect();
    
    // Aggressive Regex OR match across public dreams
    const related = await Dream.find({
        visibilityStatus: 'public',
        $or: [
            { 'publicVersion.title': { $regex: keywords.join('|'), $options: 'i' } },
            { tags: { $in: keywords } }
        ]
    })
    .select('publicVersion.title seoSlug tags publicVersion.content')
    .sort({ 'publicVersion.publishedAt': -1 })
    .limit(6)
    .lean();

    return related;
}

// Generate dynamic SEO context for the specific Long-tail Query using Cached AI
async function getOrGenerateContext(slug: string, hasAggregation: boolean) {
    await dbConnect();
    
    // 1. Check Cache
    let page = await ProgrammaticPage.findOne({ keywordSlug: slug }).lean();
    
    if (!page) {
        // 2. Generate via AI Fallback (OpenRouter)
        const readableKeyword = unslugify(slug);
        
        // If we have aggregated dreams, we just need a short intro. Else, we need a full article.
        const prompt = hasAggregation 
            ? `اكتب مقدمة قصيرة (100 كلمة) تشرح دلالة "${readableKeyword}" في قاموس تفسير الأحلام لابن سيرين.`
            : `اكتب مقالاً مفصلاً ومنسقاً (300 كلمة) يشرح معنى وتفسير "${readableKeyword}". قسمه إلى تفسير ابن سيرين والجانب النفسي.`;
            
        try {
            const completion = await openRouter.chat.completions.create({
                model: 'openai/gpt-3.5-turbo',
                messages: [{ role: 'system', content: 'أنت خبير SEO ومفسر أحلام.' }, { role: 'user', content: prompt }]
            });
            
            const content = completion.choices[0]?.message?.content || 'تم توليد هذه الصفحة تلقائياً لخدمة بحثك.';
            
            // 3. Cache to MongoDB
            const newPage = await ProgrammaticPage.create({
                keywordSlug: slug,
                title: `تفسير حلم ${readableKeyword}`,
                content: content
            });
            
            page = newPage.toObject();
        } catch (e) {
            console.error('AI Generator failed:', e);
            return null;
        }
    }
    return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { keywordSlug } = await params;
    const title = unslugify(keywordSlug);
    
    return {
        title: `تفسير حلم ${title} الدلالة الشاملة | المفسر`,
        description: `تعرف على المعاني الخفية والدلالات الشاملة حول رؤية ${title} في المنام بناءً على اجتهادات كبار المفسرين.`,
        alternates: {
            canonical: `https://almofasir.com/dreams/${keywordSlug}`,
        },
    };
}

export default async function ProgrammaticSEOPage({ params }: PageProps) {
    const { keywordSlug } = await params;
    const readableTitle = unslugify(keywordSlug);
    
    // 1. Aggregation Strategy (80%)
    const aggregatedDreams = await getAggregatedDreams(keywordSlug);
    const hasAggregation = aggregatedDreams.length > 0;
    
    // 2. AI Fallback Strategy (20%)
    const programmaticData = await getOrGenerateContext(keywordSlug, hasAggregation);

    if (!programmaticData && !hasAggregation) {
        notFound();
    }

    // Schemas
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://almofasir.com' },
        { name: 'القاموس المتقدم', url: 'https://almofasir.com/dreams' },
        { name: `حلم ${readableTitle}`, url: `https://almofasir.com/dreams/${keywordSlug}` }
    ]);
    
    const articleSchema = generateArticleSchema({
        title: programmaticData?.title || `تفسير حلم ${readableTitle}`,
        description: programmaticData?.content?.substring(0, 150) || '',
        url: `https://almofasir.com/dreams/${keywordSlug}`,
        datePublished: programmaticData?.generatedAt ? new Date(programmaticData.generatedAt).toISOString() : new Date().toISOString(),
    });

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-light)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

            <Header />

            <main className="flex-grow pt-32 pb-12">
                <div className="container max-w-4xl">
                    <h1 className="text-3xl md:text-5xl font-bold mb-8 text-[var(--color-primary-dark)] text-center">
                        {programmaticData?.title || `تفسير حلم ${readableTitle}`}
                    </h1>
                    
                    {/* The AI Generated / Cached SEO Content */}
                    {programmaticData && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[var(--color-border)] mb-12">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-secondary)]">
                                <span>✨</span>
                                الدلالة التفسيرية (ملخص ذكي)
                            </h2>
                            <div className="prose prose-lg rtl text-[var(--color-text-secondary)] leading-loose">
                                {renderTextWithBoldAndLinks(programmaticData.content)}
                            </div>
                        </div>
                    )}
                    
                    {/* Aggregated User Dreams matching the Long-tail Query */}
                    {hasAggregation && (
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px bg-[var(--color-border)] flex-grow" />
                                <h3 className="text-2xl font-bold text-[var(--color-primary-dark)]">أحلام مطابقة تم تفسيرها</h3>
                                <div className="h-px bg-[var(--color-border)] flex-grow" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {aggregatedDreams.map((dream: any) => (
                                    <Link key={dream._id.toString()} href={`/${dream.seoSlug}`} className="group bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all hover:shadow-md hover:-translate-y-1">
                                        <h4 className="text-lg font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                                            {dream.publicVersion?.title || 'اقرأ التفسير'}
                                        </h4>
                                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">
                                            {dream.publicVersion?.content || ''}
                                        </p>
                                        <div className="flex gap-2 flex-wrap mt-4">
                                            {dream.tags?.slice(0, 3).map((t: string) => (
                                                <span key={t} className="text-xs px-2 py-1 bg-[var(--color-bg-light)] text-[var(--color-primary)] rounded-full border border-[var(--color-border)]">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-16">
                        <EngagementWidget slug={`topic-${keywordSlug}`} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
