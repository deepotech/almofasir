import Link from "next/link";
import { renderTextWithBoldAndLinks } from "@/lib/internalLinking";

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
    primarySymbol?: string | null;
};

type DreamArticleProps = {
    dream: any;
    related?: RelatedDream[];
};

// Replaced by renderTextWithBoldAndLinks from lib

// ── Legacy fallback renderer ──
function LegacyInterpretationContent({ text }: { text: string }) {
    if (!text) return null;
    const paragraphs = text.split(/\n\n+/).filter(Boolean);
    return (
        <div className="space-y-5">
            {paragraphs.map((paragraph, idx) => {
                const lines = paragraph.split("\n").filter(Boolean);
                const isList = lines.every((line) => line.trim().startsWith("-"));
                if (isList) {
                    return (
                        <ul key={idx} className="dream-bullets">
                            {lines.map((line, lIdx) => (
                                <li key={lIdx} className="dream-bullet-item">
                                    <span className="dream-bullet-dot">●</span>
                                    <span>{renderTextWithBoldAndLinks(line.replace(/^-\s*/, ""))}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }
                return (
                    <p key={idx} className="dream-paragraph">
                        {renderTextWithBoldAndLinks(paragraph)}
                    </p>
                );
            })}
        </div>
    );
}

// ── Estimated reading time ──
function calcReadingTime(sections: Section[], legacyText: string): number {
    const words = sections.reduce((acc, s) => {
        const sWords = (s.content || "").split(/\s+/).length;
        const subWords = (s.subsections || []).reduce((a, sub) => a + sub.content.split(/\s+/).length, 0);
        const bWords = (s.bullets || []).join(" ").split(/\s+/).length;
        return acc + sWords + subWords + bWords;
    }, (legacyText || "").split(/\s+/).length);
    return Math.max(1, Math.ceil(words / 200));
}

// ── BulletBlock ──
function BulletBlock({ bullets, accent }: { bullets: string[]; accent?: "gold" | "green" | "yellow" }) {
    const colorMap = {
        gold: { dot: "text-[var(--color-secondary)]", bg: "bg-[var(--color-secondary)]/5", border: "border-[var(--color-secondary)]/20" },
        green: { dot: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
        yellow: { dot: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
    };
    const c = colorMap[accent || "gold"];
    return (
        <ul className={`rounded-xl p-5 border ${c.bg} ${c.border} space-y-3 mt-4`}>
            {bullets.map((b, k) => (
                <li key={k} className="flex items-start gap-3 text-[var(--color-text-secondary)] leading-[2]">
                    <span className={`${c.dot} mt-1 shrink-0 text-base`}>●</span>
                    <span>{b}</span>
                </li>
            ))}
        </ul>
    );
}

// ── Section accent detection ──
function getBulletAccent(heading: string): "gold" | "green" | "yellow" {
    if (/بشارة|خير|إيجاب/.test(heading)) return "green";
    if (/تنبيه|حذر|تحذير|انتبه/.test(heading)) return "yellow";
    return "gold";
}

export default function DreamArticle({ dream, related = [] }: DreamArticleProps) {
    const pv = dream?.publicVersion;
    const comprehensive = pv?.comprehensiveInterpretation;
    const structured = pv?.structuredInterpretation;

    const faqs: FAQ[] = pv?.faqs ?? comprehensive?.faqs ?? structured?.faqs ?? [];
    const sections: Section[] = comprehensive?.sections ?? structured?.sections ?? [];
    const snippetSummary = comprehensive?.snippetSummary ?? structured?.summary ?? null;
    const safetyNote = comprehensive?.safetyNote ?? null;
    const primarySymbol = comprehensive?.primarySymbol ?? null;
    const secondarySymbols: string[] = comprehensive?.secondarySymbols ?? [];

    const title = pv?.title ?? dream?.title ?? "تفسير الحلم";
    const publishDate = pv?.publishedAt ?? dream?.createdAt;
    const tags: string[] = dream?.tags ?? pv?.keywords ?? [];

    const legacyText = pv?.interpretation
        ? typeof pv.interpretation === "string"
            ? pv.interpretation
            : pv.interpretation?.summary
        : "";

    const readingTime = calcReadingTime(sections, legacyText);

    // Determine if dream is positive / warning from snippet or section headings
    const isBushra = snippetSummary
        ? /بشارة|خير|يدل على رزق|ييشر|إيجابي/.test(snippetSummary)
        : sections.some(s => /بشارة/.test(s.heading));
    const isTanbih = snippetSummary
        ? /تنبيه|حذر|انتبه|يدل على مشكلة/.test(snippetSummary)
        : sections.some(s => /تنبيه|حذر/.test(s.heading));

    return (
        <div className="dream-page-wrapper" dir="rtl">
            <article className="dream-article">

                {/* ── Breadcrumbs ── */}
                <nav className="dream-breadcrumbs" aria-label="مسار التنقل">
                    <ol className="breadcrumb-list">
                        <li><Link href="/" className="breadcrumb-link">الرئيسية</Link></li>
                        <li className="breadcrumb-sep" aria-hidden="true">›</li>
                        <li><Link href="/interpreted-dreams" className="breadcrumb-link">أحلام مفسرة</Link></li>
                        <li className="breadcrumb-sep" aria-hidden="true">›</li>
                        <li className="breadcrumb-current" aria-current="page">
                            {title.length > 50 ? title.slice(0, 50) + "…" : title}
                        </li>
                    </ol>
                </nav>

                {/* ── Hero Header ── */}
                <header className="dream-hero">
                    {/* Meta row */}
                    <div className="dream-meta-row">
                        {publishDate && (
                            <span className="dream-meta-badge">
                                <span aria-hidden="true">📅</span>
                                <time dateTime={new Date(publishDate).toISOString()}>
                                    {new Date(publishDate).toLocaleDateString("ar-SA", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </time>
                            </span>
                        )}
                        <span className="dream-meta-badge">
                            <span aria-hidden="true">⏱</span>
                            <span>{readingTime} دقائق قراءة</span>
                        </span>
                        {primarySymbol && (
                            <span className="dream-meta-badge dream-symbol-badge">
                                <span aria-hidden="true">🔑</span>
                                <span>{primarySymbol}</span>
                            </span>
                        )}
                    </div>

                    {/* H1 */}
                    <h1 className="dream-title">{title}</h1>

                    {/* SEO intro */}
                    {pv?.seoIntro && (
                        <p className="dream-seo-intro">{pv.seoIntro}</p>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="dream-tags" aria-label="الوسوم">
                            {tags.map((tag: string) => (
                                <span key={tag} className="dream-tag">#{tag}</span>
                            ))}
                        </div>
                    )}
                </header>

                {/* ── Summary Card ── */}
                {snippetSummary && (
                    <section className="dream-summary-card" aria-label="الخلاصة السريعة">
                        <div className="dream-summary-top-bar" />
                        <div className="dream-summary-header">
                            <span className="dream-summary-icon" aria-hidden="true">💡</span>
                            <h2 className="dream-summary-title">الخلاصة السريعة</h2>
                            {isBushra && (
                                <span className="dream-signal dream-signal--green">بشارة ✓</span>
                            )}
                            {isTanbih && (
                                <span className="dream-signal dream-signal--yellow">تنبيه ⚠</span>
                            )}
                        </div>
                        <p className="dream-summary-text">{snippetSummary}</p>
                        {safetyNote && (
                            <p className="dream-summary-note">{safetyNote}</p>
                        )}
                    </section>
                )}

                {/* ── Symbols ── */}
                {(primarySymbol || secondarySymbols.length > 0) && (
                    <div className="dream-symbols" aria-label="رموز الحلم">
                        {primarySymbol && (
                            <span className="dream-symbol-primary">
                                🔑 {primarySymbol}
                            </span>
                        )}
                        {secondarySymbols.map((sym: string) => (
                            <span key={sym} className="dream-symbol-secondary">{sym}</span>
                        ))}
                    </div>
                )}

                {/* ── Dream Narrative (collapsible) ── */}
                {pv?.content && (
                    <div className="dream-narrative-wrapper">
                        <details className="dream-narrative-details group">
                            <summary className="dream-narrative-summary">
                                <span className="dream-narrative-icon" aria-hidden="true">📜</span>
                                <span>اقرأ نص الحلم الأصلي</span>
                                <span className="dream-narrative-chevron group-open:rotate-180" aria-hidden="true">▾</span>
                            </summary>
                            <div className="dream-narrative-body">
                                {pv.content}
                            </div>
                        </details>
                    </div>
                )}

                {/* ── Main Interpretation Sections ── */}
                {sections.length > 0 ? (
                    <div className="dream-sections">
                        {sections.map((sec: Section, i: number) => (
                            <section key={i} className="dream-section">
                                <h2 className="dream-section-heading">
                                    <span className="dream-section-bar" aria-hidden="true" />
                                    {sec.heading}
                                </h2>

                                {sec.content && (
                                    <p className="dream-paragraph">{sec.content}</p>
                                )}

                                {Array.isArray(sec.subsections) && sec.subsections.length > 0 && (
                                    <div className="dream-subsections">
                                        {sec.subsections.map((sub: SubSection, j: number) => (
                                            <div key={j} className="dream-subsection">
                                                <h3 className="dream-subsection-heading">
                                                    <span aria-hidden="true">◈</span>
                                                    {sub.heading}
                                                </h3>
                                                <p className="dream-paragraph">{sub.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {Array.isArray(sec.bullets) && sec.bullets.length > 0 && (
                                    <BulletBlock
                                        bullets={sec.bullets}
                                        accent={getBulletAccent(sec.heading)}
                                    />
                                )}
                            </section>
                        ))}
                    </div>
                ) : legacyText ? (
                    <section className="dream-section">
                        <h2 className="dream-section-heading">
                            <span className="dream-section-bar" aria-hidden="true" />
                            التفسير المفصل
                        </h2>
                        <LegacyInterpretationContent text={legacyText} />
                    </section>
                ) : null}

                {/* ── FAQ ── */}
                {faqs.length > 0 && (
                    <section className="dream-faq" itemScope itemType="https://schema.org/FAQPage" aria-label="أسئلة شائعة">
                        <h2 className="dream-section-heading">
                            <span className="dream-section-bar" aria-hidden="true" />
                            أسئلة شائعة حول الحلم
                        </h2>
                        <div className="dream-faq-list">
                            {faqs.map((f: FAQ, i: number) => (
                                <details
                                    key={i}
                                    className="dream-faq-item group"
                                    itemScope
                                    itemType="https://schema.org/Question"
                                >
                                    <summary
                                        className="dream-faq-question"
                                        itemProp="name"
                                    >
                                        <span className="dream-faq-num">{i + 1}</span>
                                        <span className="dream-faq-q-text">{f.question}</span>
                                        <span className="dream-faq-chevron group-open:rotate-180 group-open:bg-[var(--color-secondary)] group-open:text-black group-open:border-[var(--color-secondary)]" aria-hidden="true">▾</span>
                                    </summary>
                                    <div
                                        className="dream-faq-answer"
                                        itemScope
                                        itemType="https://schema.org/Answer"
                                        itemProp="acceptedAnswer"
                                    >
                                        <p itemProp="text" className="dream-paragraph">{f.answer}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CTA ── */}
                <section className="dream-cta" aria-label="تفسير حلمك">
                    <div className="dream-cta-glow" aria-hidden="true" />
                    <div className="dream-cta-emoji" aria-hidden="true">✨</div>
                    <h2 className="dream-cta-title">رأيت حلمًا مشابهًا؟</h2>
                    <p className="dream-cta-text">
                        لا تدع الحيرة تقلقك. احصل على تفسير دقيق لحلمك الآن بالذكاء
                        الاصطناعي وفق منهج ابن سيرين والنابلسي — مجاناً وفوراً.
                    </p>
                    <div className="dream-cta-actions">
                        <Link href="/" className="btn btn-primary btn-lg dream-cta-btn-primary">
                            <span aria-hidden="true">✍️</span>
                            <span>اكتب حلمك الآن (مجاناً)</span>
                        </Link>
                        <Link href="/experts" className="btn btn-outline dream-cta-btn-secondary">
                            <span aria-hidden="true">🧑‍🏫</span>
                            <span>استشر مفسرًا متخصصًا</span>
                        </Link>
                    </div>
                </section>

                {/* ── Related Dreams ── */}
                {related.length > 0 && (
                    <section className="dream-related" aria-label="أحلام مشابهة">
                        <h2 className="dream-related-heading">
                            <span aria-hidden="true">🔗</span> قد يهمك أيضًا
                        </h2>
                        <div className="dream-related-grid">
                            {related.slice(0, 4).map((r) => (
                                <Link
                                    key={r.slug}
                                    href={`/${r.slug}`}
                                    className="dream-related-card group"
                                >
                                    {r.primarySymbol && (
                                        <span className="dream-related-symbol">{r.primarySymbol}</span>
                                    )}
                                    <h3 className="dream-related-title group-hover:text-[var(--color-secondary)] transition-colors">
                                        {r.title}
                                    </h3>
                                    {r.content && (
                                        <p className="dream-related-excerpt">{r.content}</p>
                                    )}
                                    <span className="dream-related-link" aria-hidden="true">اقرأ التفسير ←</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Disclaimer ── */}
                <footer className="dream-disclaimer" role="note">
                    <span aria-hidden="true">⚠️</span>
                    <span>
                        تفسير الأحلام اجتهاد ورمزي، ولا يُبنى عليه قرار مصيري.
                        استعن بالعقل والواقع، واستشر مختصًا عند الحاجة.
                    </span>
                </footer>

            </article>
        </div>
    );
}
