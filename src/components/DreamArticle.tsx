import Link from "next/link";

type FAQ = { question: string; answer: string };
type SubSection = { heading: string; content: string };
type Section = {
    heading: string;
    content?: string;
    bullets?: string[];
    subsections?: SubSection[];
};

type RelatedDream = {
    title: string;
    slug: string;
    content?: string;
};

type DreamArticleProps = {
    dream: any;
    related?: RelatedDream[];
};

export default function DreamArticle({ dream, related = [] }: DreamArticleProps) {
    const pv = dream?.publicVersion;
    // New enhanced structure (from retry-quality-gate publish)
    const comprehensive = pv?.comprehensiveInterpretation;
    // Legacy structure
    const structured = pv?.structuredInterpretation;

    // Resolve fields: prefer comprehensive → structured → fallback
    const faqs: FAQ[] = pv?.faqs ?? comprehensive?.faqs ?? structured?.faqs ?? [];
    const sections: Section[] = comprehensive?.sections ?? structured?.sections ?? [];
    const snippetSummary = comprehensive?.snippetSummary ?? structured?.summary ?? null;
    const safetyNote = comprehensive?.safetyNote ?? null;
    const primarySymbol = comprehensive?.primarySymbol ?? null;
    const secondarySymbols = comprehensive?.secondarySymbols ?? [];

    // Title & content
    const title = pv?.title ?? dream?.title ?? "تفسير الحلم";
    const publishDate = pv?.publishedAt ?? dream?.createdAt;
    const tags = dream?.tags ?? pv?.keywords ?? [];

    return (
        <article className="mx-auto max-w-4xl px-4 pb-16" dir="rtl">

            {/* ── Breadcrumbs ── */}
            <nav className="text-sm text-[var(--color-text-muted)] mb-8 pt-6">
                <ul className="flex items-center gap-2 flex-wrap">
                    <li><Link href="/" className="hover:text-[var(--color-gold)] transition-colors">الرئيسية</Link></li>
                    <li className="opacity-50">/</li>
                    <li><Link href="/interpreted-dreams" className="hover:text-[var(--color-gold)] transition-colors">أحلام تم تفسيرها</Link></li>
                    <li className="opacity-50">/</li>
                    <li className="text-[var(--color-text-primary)]">عرض الحلم</li>
                </ul>
            </nav>

            {/* ── Header: H1 + meta ── */}
            <header className="mb-10">
                {/* Date badge */}
                {publishDate && (
                    <div className="inline-block px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-xs text-[var(--color-secondary)] mb-4">
                        <time dateTime={new Date(publishDate).toISOString()}>
                            {new Date(publishDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                    </div>
                )}

                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-[var(--color-gold)] mb-6">
                    {title}
                </h1>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-6">
                        {tags.map((tag: string) => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* SEO intro */}
                {pv?.seoIntro && (
                    <div className="text-lg leading-loose text-[var(--color-text-primary)] font-medium border-r-4 border-r-[var(--color-gold)] pr-4 italic">
                        {pv.seoIntro}
                    </div>
                )}
            </header>

            {/* ── Snippet Summary (خلاصة سريعة) ── */}
            {snippetSummary && (
                <section className="mb-10 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-secondary)]/50 p-6 shadow-sm">
                    <h2 className="text-[var(--color-primary-light)] font-bold mb-3 flex items-center gap-2 text-lg">
                        <span>💡</span> الخلاصة السريعة
                    </h2>
                    <p className="text-xl leading-relaxed font-medium text-[var(--color-text-primary)]">
                        {snippetSummary}
                    </p>
                </section>
            )}

            {/* ── Symbols (Primary + Secondary) ── */}
            {primarySymbol && (
                <div className="mb-8 flex items-center gap-3 flex-wrap">
                    <span className="px-4 py-2 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold text-sm border border-[var(--color-gold)]/30">
                        🔑 {primarySymbol}
                    </span>
                    {secondarySymbols.map((sym: string) => (
                        <span
                            key={sym}
                            className="px-3 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] text-xs border border-[var(--color-border)]"
                        >
                            {sym}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Main Sections ── */}
            {sections.length > 0 ? (
                <div className="space-y-8 mb-12">
                    {sections.map((sec: Section, i: number) => (
                        <section key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 p-6 hover:border-[var(--color-primary)]/20 transition-colors">
                            <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
                                {sec.heading}
                            </h2>

                            {sec.content && (
                                <div className="text-lg leading-loose text-[var(--color-text-secondary)] whitespace-pre-line">
                                    {sec.content}
                                </div>
                            )}

                            {/* Subsections */}
                            {Array.isArray(sec.subsections) && sec.subsections.length > 0 && (
                                <div className="mt-5 space-y-4">
                                    {sec.subsections.map((sub: SubSection, j: number) => (
                                        <div key={j} className="rounded-xl bg-[var(--color-bg-tertiary)]/50 p-5 border-r-4 border-r-[var(--color-gold)]/50">
                                            <h3 className="font-bold text-lg text-[var(--color-gold)] mb-2">{sub.heading}</h3>
                                            <p className="leading-loose text-[var(--color-text-secondary)]">{sub.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bullets */}
                            {Array.isArray(sec.bullets) && sec.bullets.length > 0 && (
                                <ul className="mt-4 list-disc pr-6 space-y-2 marker:text-[var(--color-primary)]">
                                    {sec.bullets.map((b: string, k: number) => (
                                        <li key={k} className="leading-relaxed text-[var(--color-text-secondary)]">{b}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            ) : (
                /* Fallback: legacy interpretation text */
                pv?.interpretation ? (
                    <section className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 p-6">
                        <h2 className="text-xl font-bold mb-3 text-[var(--color-text-primary)]">التفسير</h2>
                        <div className="text-lg leading-loose text-[var(--color-text-secondary)] whitespace-pre-line">
                            {typeof pv.interpretation === 'string' ? pv.interpretation : pv.interpretation?.summary}
                        </div>
                    </section>
                ) : null
            )}

            {/* ── Dream Narrative (collapsible) ── */}
            {pv?.content && (
                <div className="mb-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/20 overflow-hidden">
                    <details>
                        <summary className="cursor-pointer p-5 text-lg font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 select-none">
                            <span>📜</span> عرض نص الحلم الأصلي (إعادة صياغة)
                        </summary>
                        <div className="px-6 pb-6 pt-2 text-lg leading-loose text-[var(--color-text-secondary)] whitespace-pre-line border-t border-[var(--color-border)]/50">
                            {pv.content}
                        </div>
                    </details>
                </div>
            )}

            {/* ── FAQ ── */}
            {faqs.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
                        <span>❓</span> أسئلة شائعة حول الحلم
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((f: FAQ, i: number) => (
                            <details
                                key={i}
                                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 overflow-hidden hover:border-[var(--color-gold)]/30 transition-colors"
                                itemScope
                                itemType="https://schema.org/Question"
                            >
                                <summary className="cursor-pointer p-5 font-bold text-lg text-[var(--color-text-primary)] select-none flex items-center justify-between" itemProp="name">
                                    {f.question}
                                    <span className="text-[var(--color-text-muted)] group-open:rotate-180 transition-transform text-sm">▼</span>
                                </summary>
                                <div
                                    className="px-5 pb-5 leading-loose text-[var(--color-text-secondary)] border-t border-[var(--color-border)]/50"
                                    itemScope
                                    itemType="https://schema.org/Answer"
                                    itemProp="acceptedAnswer"
                                >
                                    <p className="pt-3" itemProp="text">{f.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Safety Note ── */}
            {safetyNote && (
                <div className="mb-10 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-sm text-[var(--color-text-muted)] text-center leading-relaxed">
                    {safetyNote}
                </div>
            )}

            {/* ── CTA ── */}
            <section className="text-center py-16 bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent rounded-3xl border border-[var(--color-border)] mb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 pointer-events-none"></div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    رأيت حلمًا مشابهًا؟
                </h3>
                <p className="text-[var(--color-text-muted)] mb-8 text-lg max-w-xl mx-auto px-4">
                    لا تدع الحيرة تقلقك. احصل على تفسير دقيق لحلمك الآن باستخدام الذكاء الاصطناعي أو اطلب رأي مفسر متخصص.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
                    <Link href="/" className="btn btn-primary btn-lg px-8 py-4 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                        <span>✍️</span>
                        <span>اكتب حلمك الآن (مجاناً)</span>
                    </Link>
                </div>
            </section>

            {/* ── Related Dreams ── */}
            {related.length > 0 && (
                <section className="mb-12 border-t border-[var(--color-border)] pt-8">
                    <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-6">🔗 قد يهمك أيضاً</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {related.slice(0, 4).map((r) => (
                            <Link
                                key={r.slug}
                                href={`/${r.slug}`}
                                className="p-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] cursor-pointer transition-all bg-[var(--color-bg-secondary)]/50 group"
                            >
                                <h5 className="font-bold mb-2 group-hover:underline">{r.title}</h5>
                                {r.content && (
                                    <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{r.content}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Disclaimer ── */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm leading-7 text-yellow-100 text-center">
                ⚠️ تنبيه: تفسير الأحلام اجتهاد ورمزي، ولا يُبنى عليه قرار مصيري. استعن بالعقل والواقع، واستشر مختصًا عند الحاجة.
            </div>
        </article>
    );
}
