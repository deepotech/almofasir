'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

// ── Interfaces ──

interface DreamSection {
    heading: string;
    content?: string;
    subsections?: { heading: string; content: string }[];
    bullets?: string[];
}

interface ComprehensiveInterpretation {
    primarySymbol?: string;
    secondarySymbols?: string[];
    snippetSummary?: string;
    metaTitle?: string;
    metaDescription?: string;
    sections?: DreamSection[];
    internalLinkAnchors?: string[];
    safetyNote?: string;
}

interface PublicDream {
    id: string;
    title: string;
    content: string;
    interpretation: string | { summary: string };
    mood: string;
    tags: string[];
    date: string;
    publicVersion?: {
        engagingTitle?: string;
        title?: string;
        dreamContent?: string;
        content?: string;
        seoIntro?: string;
        interpretation?: string;
        structuredInterpretation?: any;
        comprehensiveInterpretation?: ComprehensiveInterpretation;
        publishDate?: string;
        keywords?: string[];
        faqs?: { question: string; answer: string }[];
    };
    slug?: string;
}

// ── FAQ Accordion Item ──

function FAQAccordionItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="border border-[var(--color-border)] rounded-xl overflow-hidden transition-colors"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-right flex items-center justify-between p-5 hover:bg-[var(--color-bg-secondary)] transition-colors gap-3"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
            >
                <h3 className="font-bold text-[var(--color-text-primary)] text-lg leading-relaxed">
                    {faq.question}
                </h3>
                <span
                    className={`text-[var(--color-text-muted)] text-xl shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    ▼
                </span>
            </button>
            <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p
                    className="px-5 pb-5 text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/50 pt-4"
                >
                    {faq.answer}
                </p>
            </div>
        </div>
    );
}

// ── Section Renderer ──

function InterpretationSection({ section }: { section: DreamSection }) {
    return (
        <section style={{ marginTop: '32px' }}>
            <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
                {section.heading}
            </h2>

            {section.content && (
                <p
                    className="text-lg text-[var(--color-text-secondary)] whitespace-pre-line mb-4"
                    style={{ lineHeight: 1.9 }}
                >
                    {section.content}
                </p>
            )}

            {section.subsections && section.subsections.length > 0 && (
                <div className="space-y-5 mt-5">
                    {section.subsections.map((sub, subIdx) => (
                        <div key={subIdx} className="bg-[var(--color-bg-tertiary)]/50 p-5 rounded-lg border-r-4 border-r-[var(--color-gold)]">
                            <h3 className="font-bold text-lg text-[var(--color-gold)] mb-2">
                                {sub.heading}
                            </h3>
                            <p
                                className="text-[var(--color-text-secondary)] whitespace-pre-line"
                                style={{ lineHeight: 1.9 }}
                            >
                                {sub.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc pr-6 space-y-2 mt-4 marker:text-[var(--color-primary)]">
                    {section.bullets.map((bullet, bIdx) => (
                        <li
                            key={bIdx}
                            className="text-[var(--color-text-secondary)]"
                            style={{ lineHeight: 1.9 }}
                        >
                            {bullet}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// ── Snippet Summary Box ──

function SnippetSummaryBox({ summary }: { summary: string }) {
    return (
        <div className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-gold)]/10 border border-[var(--color-primary)]/30 rounded-xl p-6 shadow-lg relative overflow-hidden mb-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-gold)]" />
            <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-1">💡</span>
                <div>
                    <span className="text-[var(--color-primary-light)] font-bold text-sm mb-2 block">
                        الخلاصة
                    </span>
                    <p className="text-xl leading-relaxed font-medium text-[var(--color-text-primary)]">
                        {summary}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Legacy Text Renderer (no dangerouslySetInnerHTML) ──

function LegacyTextContent({ text }: { text: string }) {
    if (!text) return null;

    const paragraphs = text.split(/\n\n+/).filter(Boolean);

    return (
        <div className="space-y-4" style={{ lineHeight: 1.9 }}>
            {paragraphs.map((paragraph, idx) => {
                // Check if this paragraph is a list (lines starting with -)
                const lines = paragraph.split('\n').filter(Boolean);
                const isList = lines.every(line => line.trim().startsWith('-'));

                if (isList) {
                    return (
                        <ul key={idx} className="list-disc pr-6 space-y-2 marker:text-[var(--color-primary)]">
                            {lines.map((line, lIdx) => (
                                <li key={lIdx} className="text-[var(--color-text-secondary)]">
                                    {renderBoldText(line.replace(/^-\s*/, ''))}
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={idx} className="text-lg text-[var(--color-text-secondary)]">
                        {renderBoldText(paragraph)}
                    </p>
                );
            })}
        </div>
    );
}

/** Render **bold** markers as <strong> elements safely */
function renderBoldText(text: string): (string | JSX.Element)[] {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={i} className="text-[var(--color-primary-light)]">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

// ── Main Component ──

export default function DreamDetailsContent({ id }: { id: string }) {
    const [dream, setDream] = useState<PublicDream | null>(null);
    const [relatedDreams, setRelatedDreams] = useState<PublicDream[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDream = async () => {
            try {
                const res = await fetch(`/api/dreams/public/${id}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setDream(data);

                const relatedRes = await fetch(`/api/dreams/public?limit=4`);
                if (relatedRes.ok) {
                    const relatedData = await relatedRes.json();
                    if (relatedData.dreams) {
                        setRelatedDreams(
                            relatedData.dreams
                                .filter((d: PublicDream) => d.id !== data.id && d.id !== id)
                                .slice(0, 2)
                        );
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

    // ── Loading State ──
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

    // ── Error State ──
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

    // ── Disclaimer Variants ──
    const DisclaimerVariants = [
        "هذا الحلم مأخوذ من تجربة حقيقية لأحد الزوار، وتم تنقيح البيانات للحفاظ على الخصوصية.",
        "شارك أحد مستخدمي المفسّر هذا الحلم ووافق على نشره لتعم الفائدة.",
        "قصة حقيقية: تم توثيق هذا الحلم وتفسيره عبر منصة المفسّر للذكاء الاصطناعي."
    ];
    const userDisclaimer = DisclaimerVariants[id.charCodeAt(id.length - 1) % DisclaimerVariants.length];

    // ── Detect Data Structure ──
    const comprehensive = dream.publicVersion?.comprehensiveInterpretation;
    const structured = dream.publicVersion?.structuredInterpretation;

    // ── Normalize Content ──
    const dreamTitle = dream.publicVersion?.title || dream.publicVersion?.engagingTitle || dream.title;
    const dreamNarrative = dream.publicVersion?.content || dream.publicVersion?.dreamContent || dream.content;
    const publishDate = dream.publicVersion?.publishDate || dream.date;
    const keywords = dream.publicVersion?.keywords || dream.tags;

    // ── Resolve Snippet Summary ──
    const snippetSummary = comprehensive?.snippetSummary || structured?.summary || null;

    // ── Resolve Legacy Interpretation Text ──
    const legacyText = dream.publicVersion?.interpretation
        || (typeof dream.interpretation === 'object' ? (dream.interpretation as any)?.summary : dream.interpretation)
        || '';

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16">
                <article className="container px-4 mx-auto" style={{ maxWidth: '800px' }}>

                    {/* Breadcrumbs */}
                    <nav className="text-sm breadcrumbs text-[var(--color-text-muted)] mb-8">
                        <ul>
                            <li><Link href="/">الرئيسية</Link></li>
                            <li><Link href="/interpreted-dreams">أحلام تم تفسيرها</Link></li>
                            <li className="text-[var(--color-text-primary)]">عرض الحلم</li>
                        </ul>
                    </nav>

                    {/* ── Header: Title (h1) ── */}
                    <header className="mb-8 text-center">
                        <div className="inline-block px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-xs text-[var(--color-secondary)] mb-4">
                            <time dateTime={publishDate}>
                                {new Date(publishDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-[var(--color-gold)]">
                            {dreamTitle}
                        </h1>

                        {/* Tags */}
                        <div className="flex justify-center gap-2 flex-wrap mb-6">
                            {keywords?.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Real User Disclaimer */}
                        <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)]/30 px-4 py-2 rounded-lg border border-[var(--color-border)]">
                            <span>✨</span>
                            <span>{userDisclaimer}</span>
                        </div>
                    </header>

                    {/* ── SEO Intro ── */}
                    {dream.publicVersion?.seoIntro && (
                        <div className="text-lg text-[var(--color-text-primary)] font-medium border-r-4 border-r-[var(--color-gold)] pr-4 italic mb-8" style={{ lineHeight: 1.9 }}>
                            {dream.publicVersion.seoIntro}
                        </div>
                    )}

                    {/* ── Snippet Summary (Highlighted Box) ── */}
                    {snippetSummary && <SnippetSummaryBox summary={snippetSummary} />}

                    {/* ── Interpretation Content ── */}
                    {comprehensive ? (
                        /* ── Comprehensive Structured Rendering ── */
                        <div className="mb-12">
                            {comprehensive.sections?.map((section, idx) => (
                                <InterpretationSection key={idx} section={section} />
                            ))}

                            {/* Safety Note */}
                            {comprehensive.safetyNote && (
                                <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-sm text-[var(--color-text-muted)] text-center" style={{ lineHeight: 1.9 }}>
                                    {comprehensive.safetyNote}
                                </div>
                            )}
                        </div>
                    ) : structured ? (
                        /* ── Legacy Structured Rendering ── */
                        <div className="mb-12">
                            {structured.symbols?.map((sym: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '32px' }}>
                                    <h2 className="text-2xl font-bold mb-3 text-[var(--color-gold)]">{sym.name}</h2>
                                    <p className="text-lg text-[var(--color-text-secondary)]" style={{ lineHeight: 1.9 }}>
                                        {sym.meaning}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* ── Legacy Plain Text Fallback (NO dangerouslySetInnerHTML) ── */
                        <section className="glass-card mb-10 p-8">
                            <LegacyTextContent text={legacyText} />
                        </section>
                    )}

                    {/* ── Dream Narrative Toggle ── */}
                    <div className="collapse collapse-arrow bg-[var(--color-bg-secondary)]/30 border border-[var(--color-border)] rounded-xl mb-12">
                        <input type="checkbox" />
                        <div className="collapse-title text-xl font-medium flex items-center gap-2 text-[var(--color-text-muted)]">
                            <span>📜</span>
                            عرض نص الحلم الأصلي (إعادة صياغة)
                        </div>
                        <div className="collapse-content">
                            <div className="pt-4 text-lg text-[var(--color-text-secondary)] whitespace-pre-line border-t border-[var(--color-border)]/50" style={{ lineHeight: 1.9 }}>
                                {dreamNarrative}
                            </div>
                        </div>
                    </div>

                    {/* ── FAQ Accordion ── */}
                    {dream.publicVersion?.faqs && dream.publicVersion.faqs.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
                                <span>❓</span>
                                <span>أسئلة شائعة حول الحلم</span>
                            </h2>
                            <div className="space-y-4">
                                {dream.publicVersion.faqs.map((faq, idx) => (
                                    <FAQAccordionItem key={idx} faq={faq} index={idx} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── CTA Section ── */}
                    <section className="text-center py-16 bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent rounded-3xl border border-[var(--color-border)] mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 pointer-events-none"></div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            رأيت حلمًا مشابهًا؟
                        </h2>
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

                    {/* ── Related Dreams ── */}
                    {relatedDreams.length > 0 && (
                        <section className="mb-16 border-t border-[var(--color-border)] pt-8">
                            <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">
                                🔗 قد يهمك أيضاً
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedDreams.map(related => (
                                    <Link
                                        key={related.id}
                                        href={`/${related.slug || related.id}`}
                                        className="p-4 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] cursor-pointer transition-all bg-[var(--color-bg-secondary)]/50 group"
                                    >
                                        <h3 className="font-bold mb-2 group-hover:underline">{related.title}</h3>
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
