'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import InterpretationDisplay from '@/components/InterpretationDisplay';

interface PublicDream {
    id: string;
    title: string;
    content: string;
    interpretation: string | { summary: string }; // Handle legacy or object
    mood: string;
    tags: string[];
    date: string;
    publicVersion?: {
        engagingTitle?: string;
        dreamContent?: string;
        seoIntro?: string; // NEW
        interpretation?: string;
        structuredInterpretation?: { // NEW
            summary: string;
            symbols: Array<{ name: string; meaning: string }>;
            variations: Array<{ status: string; meaning: string }>;
            psychological: string;
            conclusion: string;
        };
        publishDate?: string;
        keywords?: string[];
        faqs?: { question: string; answer: string }[];
    };
    slug?: string; // Optional slug for linking
}

export default function DreamDetailsContent({ id }: { id: string }) {
    const [dream, setDream] = useState<PublicDream | null>(null);
    const [relatedDreams, setRelatedDreams] = useState<PublicDream[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDream = async () => {
            try {
                // 1. Fetch Request Details
                const res = await fetch(`/api/dreams/public/${id}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setDream(data);

                // 2. Fetch Related/Recent Dreams (Simple logic: fetch latest public dreams excluding current)
                const relatedRes = await fetch(`/api/dreams/public?limit=4`);
                if (relatedRes.ok) {
                    const relatedData = await relatedRes.json();
                    if (relatedData.dreams) {
                        setRelatedDreams(relatedData.dreams.filter((d: PublicDream) => d.id !== data.id && d.id !== id).slice(0, 2));
                    }
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchDream();
    }, [id]);

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-32 pb-16 flex items-center justify-center">
                    <span className="loading-spinner w-10 h-10"></span>
                </main>
                <Footer />
            </>
        );
    }

    if (error || !dream) {
        return (
            <>
                <Header />
                <main className="min-h-screen pt-32 pb-16 text-center container">
                    <h1 className="text-2xl mb-4">عذراً، الحلم غير موجود أو تم حذفه.</h1>
                    <Link href="/interpreted-dreams" className="btn btn-primary">
                        العودة للأحلام
                    </Link>
                </main>
                <Footer />
            </>
        );
    }

    // Layout Anti-Pattern: Determine layout variant based on ID (odd/even) or randomness
    // e.g. If last char of ID is number and even -> Swap Interpretation and Narrative? 
    // For now, let's keep it consistent but add the "Context/Intro" first which is the main requirement.
    // We can randomize the "Real Dream" disclaimer placement or wording.

    const DisclaimerVariants = [
        "هذا الحلم مأخوذ من تجربة حقيقية لأحد الزوار، وتم تنقيح البيانات للحفاظ على الخصوصية.",
        "شارك أحد مستخدمي المفسّر هذا الحلم ووافق على نشره لتعم الفائدة.",
        "قصة حقيقية: تم توثيق هذا الحلم وتفسيره عبر منصة المفسّر للذكاء الاصطناعي."
    ];
    const userDisclaimer = DisclaimerVariants[id.charCodeAt(id.length - 1) % DisclaimerVariants.length];

    const structured = dream.publicVersion?.structuredInterpretation;

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16">
                <article className="container px-4 max-w-4xl mx-auto">

                    {/* Breadcrumbs */}
                    <nav className="text-sm breadcrumbs text-[var(--color-text-muted)] mb-8">
                        <ul>
                            <li><Link href="/">الرئيسية</Link></li>
                            <li><Link href="/interpreted-dreams">أحلام تم تفسيرها</Link></li>
                            <li className="text-[var(--color-text-primary)]">عرض الحلم</li>
                        </ul>
                    </nav>

                    {/* Header: Title */}
                    <header className="mb-8 text-center">
                        <div className="inline-block px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-xs text-[var(--color-secondary)] mb-4">
                            <time dateTime={dream.publicVersion?.publishDate || dream.date}>
                                {new Date(dream.publicVersion?.publishDate || dream.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-[var(--color-gold)]">
                            {dream.publicVersion?.engagingTitle || dream.title}
                        </h1>
                        {/* Tags as Keywords */}
                        <div className="flex justify-center gap-2 flex-wrap mb-6">
                            {(dream.publicVersion?.keywords || dream.tags)?.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Real User Disclaimer (E-E-A-T) */}
                        <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)]/30 px-4 py-2 rounded-lg border border-[var(--color-border)]">
                            <span>✨</span>
                            <span>{userDisclaimer}</span>
                        </div>
                    </header>

                    {/* 1. SEO Context Intro (New) */}
                    {dream.publicVersion?.seoIntro && (
                        <section className="mb-10 text-lg leading-loose text-[var(--color-text-primary)] font-medium border-l-4 border-l-[var(--color-gold)] pl-4 italic">
                            {dream.publicVersion.seoIntro}
                        </section>
                    )}

                    {/* 2. Dream Narrative Section */}
                    <section className="glass-card mb-10 p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-primary-light)]">
                            <span>🌙</span>
                            <span>نص الحلم كما ورد</span>
                        </h2>
                        <div className="text-lg leading-loose text-[var(--color-text-secondary)] whitespace-pre-line prose prose-invert">
                            {dream.publicVersion?.dreamContent || dream.content}
                        </div>
                    </section>

                    {/* 3. Interpretation Section */}
                    {structured ? (
                        // NEW STRUCTURED DISPLAY
                        <section className="glass-card mb-12 p-8 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50"></div>

                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-border)]">
                                <span className="text-3xl">✨</span>
                                <h2 className="text-2xl font-bold text-[var(--color-gold)]">تفسير الحلم بالتفصيل</h2>
                            </div>

                            {/* Summary */}
                            <div className="mb-8 p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                                <h3 className="font-bold text-[var(--color-primary-light)] mb-3 flex items-center gap-2">
                                    <span>💡</span> الخلاصة
                                </h3>
                                <p className="text-lg leading-relaxed">{structured.summary}</p>
                            </div>

                            {/* Symbols Grid */}
                            {structured.symbols && structured.symbols.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="font-bold text-xl mb-4 text-[var(--color-text-primary)]">ماذا تعني الرموز؟</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {structured.symbols.map((sym: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] transition-colors border-r-2 border-r-[var(--color-text-muted)] hover:border-r-[var(--color-primary)]">
                                                <span className="font-bold text-[var(--color-gold)] block mb-1">{sym.name}</span>
                                                <span className="text-sm text-[var(--color-text-secondary)]">{sym.meaning}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variations (Single/Married/etc) */}
                            {structured.variations && structured.variations.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="font-bold text-xl mb-4 text-[var(--color-text-primary)]">اختلاف التفسير حسب الحالة</h3>
                                    <div className="space-y-3">
                                        {structured.variations.map((v: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 items-start">
                                                <span className="shrink-0 px-2 py-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold min-w-[80px] text-center mt-1">
                                                    {v.status}
                                                </span>
                                                <p className="text-[var(--color-text-secondary)] leading-relaxed">{v.meaning}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Psychological */}
                            {structured.psychological && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg mb-2 text-[var(--color-text-muted)]">💭 إضاءة نفسية</h3>
                                    <p className="text-[var(--color-text-secondary)] italic leading-relaxed">{structured.psychological}</p>
                                </div>
                            )}

                            {/* Disclaimer inside interpretation */}
                            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-4 flex gap-3 text-sm text-[var(--color-text-muted)]">
                                    <span className="text-yellow-500 text-lg">⚠️</span>
                                    <p>
                                        <strong>تنبيه:</strong> {structured.conclusion || 'هذا التفسير للاستئناس، والله أعلى وأعلم.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ) : (
                        // LEGACY DISPLAY (Fallback)
                        <section className="glass-card mb-12 p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                                <span className="text-2xl">🧠</span>
                                <h2 className="text-2xl font-bold">التفسير</h2>
                            </div>
                            <div className="interpretation-content prose prose-invert max-w-none prose-p:text-[var(--color-text-secondary)] prose-p:leading-relaxed prose-headings:text-[var(--color-text-primary)]">
                                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(dream.publicVersion?.interpretation || (typeof dream.interpretation === 'object' ? (dream.interpretation as any)?.summary : dream.interpretation) || '') }} />
                            </div>
                            {/* Standard Disclaimer */}
                            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                                <div className="bg-[var(--color-bg-secondary)]/30 border border-yellow-500/10 rounded p-4 flex gap-3 text-sm text-[var(--color-text-muted)]">
                                    <span className="text-yellow-500 text-lg">⚠️</span>
                                    <p>
                                        <strong>ملاحظة مهمة:</strong> هذا التفسير اجتهادي ويعتمد على دلالات عامة، وقد يختلف المعنى باختلاف حال الرائي وتفاصيل حياته، والله أعلم.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* FAQ Section - SEO (Enhanced) */}
                    {dream.publicVersion?.faqs && dream.publicVersion.faqs.length > 0 && (
                        <section className="mb-12">
                            <h3 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
                                <span>❓</span>
                                <span>أسئلة شائعة حول الحلم</span>
                            </h3>
                            <div className="grid gap-4">
                                {dream.publicVersion.faqs.map((faq: any, idx: number) => (
                                    <div key={idx} className="glass-card p-6 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors border-r-4 border-r-transparent hover:border-r-[var(--color-gold)]">
                                        <h4 className="font-bold text-[var(--color-text-primary)] mb-2 text-lg">{faq.question}</h4>
                                        <p className="text-[var(--color-text-secondary)]">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA Section (Improved) */}
                    <section className="text-center py-16 bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent rounded-3xl border border-[var(--color-border)] mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 pointer-events-none"></div>

                        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            رأيت حلمًا مشابهًا؟
                        </h3>
                        <p className="text-[var(--color-text-muted)] mb-8 text-lg max-w-xl mx-auto">
                            لا تدع الحيرة تقلقك. احصل على تفسير دقيق لحلمك الآن باستخدام الذكاء الاصطناعي أو اطلب رأي مفسر متخصص.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/" className="btn btn-primary btn-lg px-8 py-4 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                <span>✍️</span>
                                <span>اكتب حلمك الآن (مجاناً)</span>
                            </Link>
                        </div>
                    </section>

                    {/* Internal Links / Related Dreams */}
                    {relatedDreams.length > 0 && (
                        <section className="mb-16 border-t border-[var(--color-border)] pt-8">
                            <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">🔗 قد يهمك أيضاً</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedDreams.map(related => (
                                    <Link
                                        key={related.id}
                                        href={`/${related.slug || related.id}`}
                                        className="p-4 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] cursor-pointer transition-all bg-[var(--color-bg-secondary)]/50 group"
                                    >
                                        <h5 className="font-bold mb-2 group-hover:underline">{related.title}</h5>
                                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{related.content}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </article>
            </main>
            <Footer />
        </>
    );
}

function formatMarkdown(text: string) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--color-primary-light)]">$1</strong>')
        .replace(/- (.*?)(?=\n|$)/g, '<li class="mb-2 list-disc list-inside">$1</li>')
        .replace(/\n\n/g, '<br/><br/>');
}
