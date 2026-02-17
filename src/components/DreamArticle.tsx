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

// Helper to format basic markdown (bold, lists) for legacy content
function formatMarkdown(text: string) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b class="text-[var(--color-primary)]">$1</b>') // Bold with color
        .replace(/^\s*-\s+(.*)$/gm, '<li class="list-disc mr-5">$1</li>') // List items
        .replace(/\n/g, '<br/>'); // Line breaks
}

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

            {/* ── Dream Narrative (collapsible) ── */}
            {pv?.content && (
                <div className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30 overflow-hidden shadow-sm transition-all hover:border-[var(--color-border)]/80">
                    <details className="group">
                        <summary className="cursor-pointer p-4 text-base font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-3 select-none bg-[var(--color-bg-secondary)]/50">
                            <span className="p-1.5 bg-[var(--color-bg-primary)] rounded-md text-lg">📜</span>
                            <span>اضغط لقراءة تفاصيل الحلم الأصلية</span>
                            <span className="mr-auto transition-transform duration-300 group-open:rotate-180 opacity-50">▼</span>
                        </summary>
                        <div className="px-6 pb-6 pt-4 text-lg leading-loose text-[var(--color-text-secondary)] whitespace-pre-line border-t border-[var(--color-border)]/30">
                            {pv.content}
                        </div>
                    </details>
                </div>
            )}

            {/* ── Symbols (Primary + Secondary) ── */}
            {primarySymbol && (
                <div className="mb-8 flex items-center gap-3 flex-wrap animate-fadeIn">
                    <span className="px-4 py-2 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] font-bold text-sm border border-[var(--color-gold)]/20 shadow-sm shadow-[var(--color-gold)]/5">
                        🔑 {primarySymbol}
                    </span>
                    {secondarySymbols.map((sym: string) => (
                        <span
                            key={sym}
                            className="px-3 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] text-xs border border-[var(--color-border)]"
                        >
                            # {sym}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Main Sections ── */}
            {sections.length > 0 ? (
                <div className="space-y-8 mb-16">
                    {sections.map((sec: Section, i: number) => (
                        <section key={i} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/20 p-6 md:p-8 hover:border-[var(--color-primary)]/10 transition-colors shadow-sm">
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[var(--color-text-primary)] flex items-center gap-2">
                                <span className="w-1.5 h-8 bg-[var(--color-gold)] rounded-full inline-block"></span>
                                {sec.heading}
                            </h2>

                            {sec.content && (
                                <div className="text-lg leading-9 text-[var(--color-text-secondary)] whitespace-pre-line mb-6 opacity-90">
                                    {sec.content}
                                </div>
                            )}

                            {/* Subsections */}
                            {Array.isArray(sec.subsections) && sec.subsections.length > 0 && (
                                <div className="mt-6 grid gap-4">
                                    {sec.subsections.map((sub: SubSection, j: number) => (
                                        <div key={j} className="rounded-2xl bg-[var(--color-bg-tertiary)]/30 p-5 border border-white/5 hover:border-white/10 transition-colors">
                                            <h3 className="font-bold text-lg text-[var(--color-gold)] mb-3 flex items-center gap-2">
                                                🔹 {sub.heading}
                                            </h3>
                                            <p className="leading-loose text-[var(--color-text-secondary)] opacity-90">{sub.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bullets */}
                            {Array.isArray(sec.bullets) && sec.bullets.length > 0 && (
                                <ul className="mt-6 space-y-3 bg-[var(--color-bg-tertiary)]/20 p-6 rounded-2xl border border-white/5">
                                    {sec.bullets.map((b: string, k: number) => (
                                        <li key={k} className="leading-relaxed text-[var(--color-text-secondary)] flex items-start gap-3">
                                            <span className="text-[var(--color-primary)] mt-1.5">•</span>
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            ) : (
                /* Fallback: legacy interpretation text with Markdown Formatting */
                pv?.interpretation ? (
                    <section className="mb-12 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 p-6 md:p-8 shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 text-[var(--color-text-primary)] flex items-center gap-3">
                            <span className="text-3xl">📖</span>
                            <span>التفسير المفصل</span>
                        </h2>
                        <div
                            className="prose prose-invert prose-lg max-w-none text-[var(--color-text-secondary)] leading-9"
                            dangerouslySetInnerHTML={{
                                __html: formatMarkdown(
                                    typeof pv.interpretation === 'string' ? pv.interpretation : pv.interpretation?.summary
                                )
                            }}
                        />
                    </section>
                ) : null
            )}

            {/* ── FAQ ── */}
            {faqs.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[var(--color-text-primary)] flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">❓</span>
                        <span>أسئلة شائعة حول الحلم</span>
                    </h2>
                    <div className="grid gap-4">
                        {faqs.map((f: FAQ, i: number) => (
                            <details
                                key={i}
                                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/40 overflow-hidden hover:border-[var(--color-gold)]/30 transition-all duration-300" // Styled details
                                itemScope
                                itemType="https://schema.org/Question"
                            >
                                <summary className="cursor-pointer p-5 font-bold text-lg text-[var(--color-text-primary)] select-none flex items-center justify-between hover:bg-white/5 transition-colors" itemProp="name">
                                    <span className="flex items-center gap-3">
                                        <span className="text-[var(--color-text-muted)] text-sm font-normal">#{i + 1}</span>
                                        {f.question}
                                    </span>
                                    <span className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-text-muted)] group-open:rotate-180 group-open:bg-[var(--color-gold)] group-open:border-[var(--color-gold)] group-open:text-black transition-all">
                                        ▼
                                    </span>
                                </summary>
                                <div
                                    className="px-6 pb-6 pt-2 leading-loose text-[var(--color-text-secondary)] border-t border-[var(--color-border)]/30 bg-[var(--color-bg-tertiary)]/10"
                                    itemScope
                                    itemType="https://schema.org/Answer"
                                    itemProp="acceptedAnswer"
                                >
                                    <p className="pt-2 opacity-90" itemProp="text">{f.answer}</p>
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
