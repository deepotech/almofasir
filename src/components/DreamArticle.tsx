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

// ── Safe bold text renderer (replaces dangerouslySetInnerHTML) ──

function renderTextWithBold(text: string): (string | React.ReactElement)[] {
    if (!text) return [text];
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="text-[var(--color-primary-light)] font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

// ── Legacy text renderer (no dangerouslySetInnerHTML) ──

function LegacyInterpretationContent({ text }: { text: string }) {
    if (!text) return null;

    const paragraphs = text.split(/\n\n+/).filter(Boolean);

    return (
        <div className="space-y-6" style={{ lineHeight: 2 }}>
            {paragraphs.map((paragraph, idx) => {
                const lines = paragraph.split("\n").filter(Boolean);
                const isList = lines.every((line) => line.trim().startsWith("-"));

                if (isList) {
                    return (
                        <ul key={idx} className="pr-6 space-y-3 mt-4">
                            {lines.map((line, lIdx) => (
                                <li key={lIdx} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
                                    <span className="text-[var(--color-primary)] mt-1.5 shrink-0">•</span>
                                    <span>{renderTextWithBold(line.replace(/^-\s*/, ""))}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={idx} className="text-lg text-[var(--color-text-secondary)]">
                        {renderTextWithBold(paragraph)}
                    </p>
                );
            })}
        </div>
    );
}


export default function DreamArticle({ dream, related = [] }: DreamArticleProps) {
    const pv = dream?.publicVersion;
    const comprehensive = pv?.comprehensiveInterpretation;
    const structured = pv?.structuredInterpretation;

    // Resolve fields
    const faqs: FAQ[] = pv?.faqs ?? comprehensive?.faqs ?? structured?.faqs ?? [];
    const sections: Section[] = comprehensive?.sections ?? structured?.sections ?? [];
    const snippetSummary = comprehensive?.snippetSummary ?? structured?.summary ?? null;
    const safetyNote = comprehensive?.safetyNote ?? null;
    const primarySymbol = comprehensive?.primarySymbol ?? null;
    const secondarySymbols = comprehensive?.secondarySymbols ?? [];

    const title = pv?.title ?? dream?.title ?? "تفسير الحلم";
    const publishDate = pv?.publishedAt ?? dream?.createdAt;
    const tags = dream?.tags ?? pv?.keywords ?? [];

    // Legacy text fallback
    const legacyText = pv?.interpretation
        ? typeof pv.interpretation === "string"
            ? pv.interpretation
            : pv.interpretation?.summary
        : "";

    return (
        <article className="mx-auto px-6 pb-16" style={{ maxWidth: "768px" }} dir="rtl">

            {/* ── Breadcrumbs ── */}
            <nav className="text-sm text-[var(--color-text-muted)] mb-10 pt-6">
                <ul className="flex items-center gap-2 flex-wrap">
                    <li><Link href="/" className="hover:text-[var(--color-gold)] transition-colors">الرئيسية</Link></li>
                    <li className="opacity-40">/</li>
                    <li><Link href="/interpreted-dreams" className="hover:text-[var(--color-gold)] transition-colors">أحلام تم تفسيرها</Link></li>
                    <li className="opacity-40">/</li>
                    <li className="text-[var(--color-text-primary)]">عرض الحلم</li>
                </ul>
            </nav>

            {/* ── Header: H1 + meta ── */}
            <header className="mb-14">
                {publishDate && (
                    <div className="inline-block px-4 py-1.5 bg-[var(--color-bg-tertiary)] rounded-full text-xs text-[var(--color-secondary)] mb-5">
                        <time dateTime={new Date(publishDate).toISOString()}>
                            {new Date(publishDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                        </time>
                    </div>
                )}

                <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-[var(--color-gold)]" style={{ lineHeight: 1.4 }}>
                    {title}
                </h1>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-8">
                        {tags.map((tag: string) => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 rounded-full bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* SEO intro */}
                {pv?.seoIntro && (
                    <div
                        className="text-lg text-[var(--color-text-primary)] font-medium border-r-4 border-r-[var(--color-gold)] pr-5 italic"
                        style={{ lineHeight: 2 }}
                    >
                        {pv.seoIntro}
                    </div>
                )}
            </header>

            {/* ── Snippet Summary (Highlighted Box) ── */}
            {snippetSummary && (
                <section className="mb-14 rounded-2xl border border-[var(--color-primary)]/30 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-gold)]/10 p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-gold)]" />
                    <h2 className="text-[var(--color-primary-light)] font-bold mb-4 flex items-center gap-3 text-lg">
                        <span className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-xl">💡</span>
                        <span>الخلاصة السريعة</span>
                    </h2>
                    <p className="text-xl font-medium text-[var(--color-text-primary)]" style={{ lineHeight: 2 }}>
                        {snippetSummary}
                    </p>
                </section>
            )}

            {/* ── Dream Narrative (collapsible) ── */}
            {pv?.content && (
                <div className="mb-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30 overflow-hidden shadow-sm transition-all hover:border-[var(--color-border)]/80">
                    <details className="group">
                        <summary className="cursor-pointer p-5 text-base font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-3 select-none bg-[var(--color-bg-secondary)]/50">
                            <span className="p-1.5 bg-[var(--color-bg-primary)] rounded-md text-lg">📜</span>
                            <span>اضغط لقراءة تفاصيل الحلم الأصلية</span>
                            <span className="mr-auto transition-transform duration-300 group-open:rotate-180 opacity-50">▼</span>
                        </summary>
                        <div
                            className="px-6 pb-6 pt-4 text-lg text-[var(--color-text-secondary)] whitespace-pre-line border-t border-[var(--color-border)]/30"
                            style={{ lineHeight: 2 }}
                        >
                            {pv.content}
                        </div>
                    </details>
                </div>
            )}

            {/* ── Symbols (Primary + Secondary) ── */}
            {primarySymbol && (
                <div className="mb-14 flex items-center gap-3 flex-wrap">
                    <span className="px-5 py-2.5 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] font-bold text-sm border border-[var(--color-gold)]/20 shadow-sm shadow-[var(--color-gold)]/5">
                        🔑 {primarySymbol}
                    </span>
                    {secondarySymbols.map((sym: string) => (
                        <span
                            key={sym}
                            className="px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] text-xs border border-[var(--color-border)]"
                        >
                            # {sym}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Main Interpretation Sections ── */}
            {sections.length > 0 ? (
                <div className="mb-16">
                    {sections.map((sec: Section, i: number) => (
                        <section key={i} style={{ marginTop: i === 0 ? 0 : "56px" }}>

                            {/* Section H2 */}
                            <h2
                                className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3 mb-8"
                                style={{ lineHeight: 1.5 }}
                            >
                                <span className="w-1.5 h-9 bg-[var(--color-gold)] rounded-full inline-block shrink-0" />
                                {sec.heading}
                            </h2>

                            {/* Section content */}
                            {sec.content && (
                                <p
                                    className="text-lg text-[var(--color-text-secondary)] whitespace-pre-line mb-8"
                                    style={{ lineHeight: 2 }}
                                >
                                    {sec.content}
                                </p>
                            )}

                            {/* Subsections */}
                            {Array.isArray(sec.subsections) && sec.subsections.length > 0 && (
                                <div className="space-y-6 mt-8">
                                    {sec.subsections.map((sub: SubSection, j: number) => (
                                        <div
                                            key={j}
                                            className="rounded-2xl bg-[var(--color-bg-tertiary)]/30 p-6 border-r-4 border-r-[var(--color-gold)] border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <h3 className="font-bold text-lg text-[var(--color-gold)] mb-4 flex items-center gap-2">
                                                🔹 {sub.heading}
                                            </h3>
                                            <p
                                                className="text-[var(--color-text-secondary)]"
                                                style={{ lineHeight: 2 }}
                                            >
                                                {sub.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bullets */}
                            {Array.isArray(sec.bullets) && sec.bullets.length > 0 && (
                                <ul className="mt-8 space-y-4 bg-[var(--color-bg-tertiary)]/20 p-6 rounded-2xl border border-white/5">
                                    {sec.bullets.map((b: string, k: number) => (
                                        <li key={k} className="flex items-start gap-3 text-[var(--color-text-secondary)]" style={{ lineHeight: 2 }}>
                                            <span className="text-[var(--color-primary)] mt-1.5 shrink-0 text-lg">•</span>
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            ) : legacyText ? (
                /* ── Legacy text fallback (NO dangerouslySetInnerHTML) ── */
                <section className="mb-14 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 p-8 shadow-sm">
                    <h2 className="text-2xl font-bold mb-8 text-[var(--color-text-primary)] flex items-center gap-3">
                        <span className="text-3xl">📖</span>
                        <span>التفسير المفصل</span>
                    </h2>
                    <LegacyInterpretationContent text={legacyText} />
                </section>
            ) : null}

            {/* ── FAQ Accordion ── */}
            {faqs.length > 0 && (
                <section className="mb-16" itemScope itemType="https://schema.org/FAQPage">
                    <h2 className="text-2xl md:text-3xl font-bold mb-10 text-[var(--color-text-primary)] flex items-center gap-3">
                        <span className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] text-xl">❓</span>
                        <span>أسئلة شائعة حول الحلم</span>
                    </h2>
                    <div className="space-y-5">
                        {faqs.map((f: FAQ, i: number) => (
                            <details
                                key={i}
                                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/40 overflow-hidden hover:border-[var(--color-gold)]/30 transition-all duration-300"
                                itemScope
                                itemType="https://schema.org/Question"
                            >
                                <summary
                                    className="cursor-pointer p-6 font-bold text-lg text-[var(--color-text-primary)] select-none flex items-center justify-between hover:bg-white/5 transition-colors"
                                    itemProp="name"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-muted)] text-xs font-normal">
                                            {i + 1}
                                        </span>
                                        {f.question}
                                    </span>
                                    <span className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-text-muted)] text-sm group-open:rotate-180 group-open:bg-[var(--color-gold)] group-open:border-[var(--color-gold)] group-open:text-black transition-all duration-300">
                                        ▼
                                    </span>
                                </summary>
                                <div
                                    className="px-6 pb-6 pt-3 border-t border-[var(--color-border)]/30 bg-[var(--color-bg-tertiary)]/10"
                                    itemScope
                                    itemType="https://schema.org/Answer"
                                    itemProp="acceptedAnswer"
                                >
                                    <p className="pt-2 text-[var(--color-text-secondary)]" style={{ lineHeight: 2 }} itemProp="text">
                                        {f.answer}
                                    </p>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Safety Note ── */}
            {safetyNote && (
                <div className="mb-14 p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-sm text-[var(--color-text-muted)] text-center" style={{ lineHeight: 2 }}>
                    {safetyNote}
                </div>
            )}

            {/* ── CTA ── */}
            <section className="text-center py-20 bg-gradient-to-b from-[var(--color-bg-secondary)] to-transparent rounded-3xl border border-[var(--color-border)] mb-14 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 pointer-events-none" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white px-4">
                    رأيت حلمًا مشابهًا؟
                </h2>
                <p className="text-[var(--color-text-muted)] mb-10 text-lg max-w-xl mx-auto px-6" style={{ lineHeight: 2 }}>
                    لا تدع الحيرة تقلقك. احصل على تفسير دقيق لحلمك الآن باستخدام الذكاء الاصطناعي أو اطلب رأي مفسر متخصص.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 px-6">
                    <Link href="/" className="btn btn-primary btn-lg px-10 py-5 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                        <span>✍️</span>
                        <span>اكتب حلمك الآن (مجاناً)</span>
                    </Link>
                </div>
            </section>

            {/* ── Related Dreams ── */}
            {related.length > 0 && (
                <section className="mb-14 border-t border-[var(--color-border)] pt-10">
                    <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-8">
                        🔗 قد يهمك أيضاً
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {related.slice(0, 4).map((r) => (
                            <Link
                                key={r.slug}
                                href={`/${r.slug}`}
                                className="p-5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] cursor-pointer transition-all bg-[var(--color-bg-secondary)]/50 group"
                            >
                                <h3 className="font-bold mb-2 group-hover:underline">{r.title}</h3>
                                {r.content && (
                                    <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{r.content}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Disclaimer ── */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-sm text-yellow-100 text-center" style={{ lineHeight: 2 }}>
                ⚠️ تنبيه: تفسير الأحلام اجتهاد ورمزي، ولا يُبنى عليه قرار مصيري. استعن بالعقل والواقع، واستشر مختصًا عند الحاجة.
            </div>
        </article>
    );
}
