import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSymbolData } from '@/lib/symbolsData';
import dbConnect from '@/lib/mongodb';
import Dream from '@/models/Dream';
import { dreamSymbols } from '@/data/symbols';
import { generateArticleSchema, generateBreadcrumbSchema, generateDreamListSchema } from '@/lib/seo';
import EngagementWidget from '@/components/seo/EngagementWidget';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { symbol: slug } = await params;
    const symbol = await getSymbolData(slug);
    
    if (!symbol) {
        return { title: 'الرمز غير موجود | المفسر' };
    }

    return {
        title: `تفسير حلم ${symbol.name} - ابن سيرين والنابلسي | المفسر`,
        description: `اكتشف تفسير حلم ${symbol.name} بالتفصيل للرجل والمرأة، العزباء والمتزوجة والحامل. دليلك الشامل لتأويل رمز ${symbol.name} في المنام.`,
        alternates: {
            canonical: `https://almofasir.com/symbols/${symbol.id}`,
        },
    };
}

export default async function SymbolDetailPage({ params }: PageProps) {
    const { symbol: slug } = await params;
    const symbol = await getSymbolData(slug);

    if (!symbol) {
        notFound();
    }

    // Fetch related published dreams
    let relatedDreams: any[] = [];
    try {
        await dbConnect();
        relatedDreams = await Dream.find({
            visibilityStatus: 'public',
            $or: [
                { 'publicVersion.comprehensiveInterpretation.primarySymbol': symbol.name },
                { 'publicVersion.comprehensiveInterpretation.primarySymbol': symbol.id },
                { tags: symbol.name },
                { tags: { $in: symbol.aliases } }
            ]
        })
            .select('publicVersion.title seoSlug updatedAt')
            .sort({ 'publicVersion.publishedAt': -1 })
            .limit(6)
            .lean();
    } catch(e) {
        console.error('Error fetching related dreams for symbol:', e);
    }

    const tabs = [
        { id: 'general', label: 'التفسير العام', content: symbol.interpretations.general },
        { id: 'married', label: 'للمتزوجة', content: symbol.interpretations.forMarried },
        { id: 'single', label: 'للعزباء', content: symbol.interpretations.forSingle },
        { id: 'man', label: 'للرجل', content: symbol.interpretations.forMan },
        { id: 'pregnant', label: 'للحامل', content: symbol.interpretations.forPregnant },
        { id: 'psychology', label: 'التحليل النفسي', content: symbol.interpretations.psychological },
    ].filter(t => t.content);

    // Schemas
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: 'https://almofasir.com' },
        { name: 'مكتبة الرموز', url: 'https://almofasir.com/symbols' },
        { name: `تفسير ${symbol.name}`, url: `https://almofasir.com/symbols/${symbol.id}` }
    ]);

    const articleSchema = generateArticleSchema({
        title: `تفسير حلم ${symbol.name}`,
        description: symbol.interpretations.general || '',
        url: `https://almofasir.com/symbols/${symbol.id}`,
        datePublished: new Date().toISOString(), // Dynamic for hub pages
    });

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-light)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

            <Header />

            <main className="flex-grow pt-24 pb-12">
                <section className="section">
                    <div className="container" style={{ maxWidth: 900 }}>
                        {/* Breadcrumb */}
                        <div className="mb-8 flex items-center gap-2 text-[var(--color-text-secondary)] text-sm font-medium">
                            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">الرئيسية</Link>
                            <span>/</span>
                            <Link href="/symbols" className="hover:text-[var(--color-primary)] transition-colors">مكتبة الرموز</Link>
                            <span>/</span>
                            <span className="text-[var(--color-text-primary)]">{symbol.name}</span>
                        </div>

                        {/* Symbol Header */}
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-center mb-12 shadow-lg">
                            <div className="text-6xl mb-6">{symbol.icon}</div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                تفسير حلم {symbol.name}
                            </h1>
                            <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-2xl mx-auto">
                                {symbol.interpretations.general}
                            </p>

                            {symbol.relatedSymbols.length > 0 && (
                                <div className="flex justify-center gap-2 flex-wrap mt-8">
                                    {symbol.relatedSymbols.map((rs, idx) => (
                                        <span key={idx} className="px-4 py-1.5 bg-[var(--color-bg-light)] text-[var(--color-primary)] rounded-full text-sm font-medium">
                                            {rs}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Public Dreams (SEO Internal Linking Structure) */}
                        {relatedDreams && relatedDreams.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-2xl font-bold text-[var(--color-primary-dark)] mb-6 flex items-center gap-2">
                                    <span>💭</span>
                                    أحلام تم تفسيرها مؤخراً
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {relatedDreams.map((dream: any) => (
                                        <Link href={`/${dream.seoSlug}`} key={dream._id.toString()} className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:border-[var(--color-primary)]/40 transition-colors shadow-sm flex items-center gap-3 hover:bg-white/10">
                                            <span className="text-2xl">📖</span>
                                            <div>
                                                <h4 className="font-bold text-white hover:text-[var(--color-primary-light)]">{dream.publicVersion?.title || 'تفسير حلم'}</h4>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interpretation Tabs */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-[var(--color-primary-dark)] mb-6 flex items-center gap-2">
                                <span>📋</span>
                                التفسير حسب الحالة
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tabs.map(tab => (
                                    <div key={tab.id} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/10 hover:bg-white/10 transition-colors">
                                        <h4 className="text-[var(--color-primary-light)] font-bold text-lg mb-3 flex items-center gap-2">
                                            {tab.label}
                                        </h4>
                                        <p className="text-gray-300 leading-relaxed">{tab.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <EngagementWidget slug={`symbol-${symbol.id}`} />

                        {/* Classical References */}
                        {(symbol.interpretations.ibnSirin || symbol.interpretations.nabulsi) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                {symbol.interpretations.ibnSirin && (
                                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-[#f59e0b]/20 relative overflow-hidden hover:bg-white/10 transition-colors">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/5 rounded-bl-full" />
                                        <h4 className="text-xl font-bold text-[#f59e0b] mb-4 flex items-center gap-2">
                                            <span>📜</span>
                                            ابن سيرين
                                        </h4>
                                        <p className="text-gray-300 leading-loose font-medium italic relative z-10">"{symbol.interpretations.ibnSirin}"</p>
                                    </div>
                                )}

                                {symbol.interpretations.nabulsi && (
                                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-[#8b5cf6]/20 relative overflow-hidden hover:bg-white/10 transition-colors">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b5cf6]/5 rounded-bl-full" />
                                        <h4 className="text-xl font-bold text-[#8b5cf6] mb-4 flex items-center gap-2">
                                            <span>📚</span>
                                            النابلسي
                                        </h4>
                                        <p className="text-gray-300 leading-loose font-medium italic relative z-10">"{symbol.interpretations.nabulsi}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-3xl p-8 text-center text-white shadow-xl mt-16 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">🌟 هل رأيت {symbol.name} في منامك؟</h3>
                            <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg relative z-10">
                                احصل على تفسير مخصص ودقيق لحلمك من خبراء التفسير على منصة المفسر
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                                <Link href="/" className="bg-white text-[var(--color-primary-dark)] px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-transform hover:-translate-y-1">
                                    تفسير مجاني بالذكاء الاصطناعي
                                </Link>
                                <Link href="/experts" className="bg-black/20 text-white border border-white/20 px-8 py-3 rounded-xl font-bold hover:bg-black/30 transition-transform hover:-translate-y-1">
                                    تواصل مع مفسر خبير
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
