'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const articles = [
    {
        title: "عناق الميت في المنام.. هل له دلالة سيئة؟ تفسير شامل ورؤية متعمقة",
        slug: "hugging-dead-dream-interpretation",
        description: "هل سبق واستيقظت من نومك بعد حلم عناق الميت وأنت تشعر بمزيج من الحنين والقلق؟ نقدم نظرة شاملة لرمز عناق الميت في المنام بين البشرى وحديث النفس.",
        date: new Date().toISOString().split('T')[0],
        readTime: "5 دقائق",
        category: "تفسيرات شاملة",
        icon: "🫂"
    },
    {
        title: "تفسير حلم السيارة في المنام لابن سيرين: دليل شامل لـ 30 حالة وألوان السيارة والحالات الاجتماعية",
        slug: "car-dream-interpretation",
        description: "في هذا الدليل الشامل، نقدم لك تفسير حلم السيارة في المنام وفقًا لرؤية الإمام ابن سيرين وكبار المفسرين مثل النابلسي وابن شاهين. ستجد تحليلًا دقيقًا لجميع الحالات التي قد تراها في منامك.",
        date: "2024-03-01",
        readTime: "8 دقائق",
        category: "تفسيرات شاملة",
        icon: "🚗"
    }
];

export default function ArticlesPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        {/* ── Header ── */}
                        <div className="text-center mb-3xl" suppressHydrationWarning>
                            <h1 className="mb-md">📚 مقالات علمية وتفسيرات شاملة</h1>
                            <p className="text-muted" style={{ maxWidth: 700, margin: '0 auto', lineHeight: 2 }}>
                                استكشف أدلة شاملة وشروحات مفصلة لأكثر الأحلام شيوعاً، مبنية على أصول علم تفسير الرؤى
                                لتراث ابن سيرين والنابلسي وغيرهم من كبار المفسرين.
                            </p>
                        </div>

                        {/* ── Articles Grid ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-3xl" suppressHydrationWarning>
                            {articles.map((article, idx) => (
                                <Link href={`/learn/articles/${article.slug}`} key={idx} className="block group">
                                    <article className="card hover-card h-full flex flex-col border border-[var(--color-border)] hover:border-[var(--color-gold)] transition-all bg-[var(--color-bg-secondary)]/30">

                                        {/* Icon/Thumbnail Placeholder */}
                                        <div className="aspect-video bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-primary)] flex items-center justify-center text-5xl mb-md rounded-lg border border-[var(--color-border)] group-hover:scale-[1.02] transition-transform" suppressHydrationWarning>
                                            {article.icon}
                                        </div>

                                        {/* Meta Meta */}
                                        <div className="flex justify-between items-center mb-sm">
                                            <span className="text-xs font-medium text-[var(--color-primary-light)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
                                                {article.category}
                                            </span>
                                            <div className="flex gap-3 text-xs text-muted">
                                                <span className="flex items-center gap-1">⏱️ {article.readTime}</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="font-bold text-xl mb-3 line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors" style={{ lineHeight: 1.5 }}>
                                            {article.title}
                                        </h3>

                                        <p className="text-[var(--color-text-secondary)] text-sm line-clamp-3 flex-grow" style={{ lineHeight: 1.8 }}>
                                            {article.description}
                                        </p>

                                        {/* Read More Link */}
                                        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm font-semibold text-[var(--color-primary-light)] group-hover:text-[var(--color-gold)]">
                                            <span>اقرأ المقال كاملاً</span>
                                            <span className="transform -translate-x-2 group-hover:translate-x-0 transition-transform">←</span>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>

                        {/* ── Footer Navigation ── */}
                        <div className="text-center bg-[var(--color-bg-secondary)]/50 p-8 rounded-2xl border border-[var(--color-border)]" suppressHydrationWarning>
                            <p className="text-lg mb-6">هل تبحث عن إجابات سريعة أو مواضيع محددة؟</p>
                            <div className="flex justify-center gap-4 flex-wrap">
                                <Link href="/learn/faq" className="btn btn-outline flex items-center gap-2">
                                    <span>❓</span> الأسئلة الشائعة
                                </Link>
                                <Link href="/learn/videos" className="btn btn-ghost flex items-center gap-2">
                                    <span>🎬</span> مكتبة الفيديو
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
