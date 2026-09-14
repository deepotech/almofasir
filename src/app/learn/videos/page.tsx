import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { getPublishedVideos } from '@/lib/videos';

export const revalidate = 1800; // ISR revalidate every 30 minutes

export const metadata: Metadata = {
    title: 'مكتبة الفيديو التعليمية لتفسير الأحلام | منصة المُفسِّر',
    description: 'مقاطع مرئية تعليمية وتثقيفية حول أسرار علم تفسير الأحلام والرموز المتكررة، من محتوى منصة المُفسِّر على تيك توك.',
    alternates: {
        canonical: 'https://almofasir.com/learn/videos',
    },
    openGraph: {
        title: 'مكتبة الفيديو التعليمية | المُفسِّر',
        description: 'مقاطع مرئية تعليمية وتثقيفية حول علم تفسير الأحلام وأسرار الرؤى.',
        url: 'https://almofasir.com/learn/videos',
        type: 'website',
    },
};

const CATEGORIES = ['الكل', 'تعليمي', 'مفاهيم', 'رموز', 'آداب', 'تساؤلات', 'تاريخ'];

interface PageProps {
    searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function VideosPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const selectedCategory = params.category && CATEGORIES.includes(params.category) ? params.category : 'الكل';
    const currentPage = parseInt(params.page || '1', 10) || 1;
    const pageSize = 12;
    const offset = (currentPage - 1) * pageSize;

    const { videos, total } = await getPublishedVideos({
        category: selectedCategory === 'الكل' ? undefined : selectedCategory,
        limit: pageSize,
        offset,
    });

    const totalPages = Math.ceil(total / pageSize) || 1;

    // Breadcrumb Schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'الرئيسية',
                item: 'https://almofasir.com',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'تعلّم',
                item: 'https://almofasir.com/learn',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'مكتبة الفيديو',
                item: 'https://almofasir.com/learn/videos',
            },
        ],
    };

    return (
        <>
            {/* Schema.org Breadcrumb JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        {/* Title & Intro */}
                        <div className="text-center mb-3xl" suppressHydrationWarning>
                            <h1 className="mb-md">🎬 مكتبة الفيديو</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                مقاطع مرئية تعليمية وتثقيفية حول علم تفسير الأحلام، برؤية شرعية وتحليل رمزي دقيق.
                            </p>

                            {/* TikTok Channel Reference Badge */}
                            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs text-muted">
                                <span>محتوى الحساب الرسمي:</span>
                                <a
                                    href="https://www.tiktok.com/@almofasir_"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[var(--color-primary-light)] hover:underline"
                                    dir="ltr"
                                >
                                    @almofasir_
                                </a>
                            </div>
                        </div>

                        {/* Categories Filter Bar */}
                        <div className="flex justify-center gap-2 flex-wrap mb-2xl">
                            {CATEGORIES.map((cat) => {
                                const isActive = selectedCategory === cat;
                                const href = cat === 'الكل' ? '/learn/videos' : `/learn/videos?category=${encodeURIComponent(cat)}`;
                                return (
                                    <Link
                                        key={cat}
                                        href={href}
                                        className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                                            isActive
                                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-bold'
                                                : 'bg-[var(--color-bg-secondary)] text-muted border-[var(--color-border)] hover:border-white/20'
                                        }`}
                                    >
                                        {cat}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Videos Grid */}
                        {videos.length === 0 ? (
                            <div className="text-center py-16 card mb-3xl">
                                <p className="text-lg text-muted mb-2">لا توجد مقاطع فيديو في هذا التصنيف حالياً.</p>
                                <Link href="/learn/videos" className="btn btn-outline btn-sm">
                                    عرض جميع المقاطع
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-3xl" suppressHydrationWarning>
                                {videos.map((video) => (
                                    <Link
                                        key={video.id || video.slug}
                                        href={`/learn/videos/${video.slug}`}
                                        className="card hover-card block text-inherit no-underline group transition-all duration-300"
                                        suppressHydrationWarning
                                    >
                                        {/* Thumbnail Container */}
                                        <div className="aspect-video bg-[var(--color-bg-secondary)] flex items-center justify-center text-4xl mb-md rounded-lg relative overflow-hidden">
                                            {video.thumbnailUrl ? (
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />

                                            ) : (
                                                <div className="text-4xl transition-transform duration-300 group-hover:scale-110">
                                                    🎬
                                                </div>
                                            )}

                                            {/* Hover Play Icon Overlay */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-md">
                                                    ▶️
                                                </span>
                                            </div>

                                            {/* Duration Badge if available */}
                                            {video.duration && (
                                                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                                                    {video.duration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta & Title */}
                                        <div suppressHydrationWarning>
                                            <div className="flex justify-between items-start mb-sm">
                                                <span className="text-xs text-[var(--color-primary-light)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                                                    {video.category}
                                                </span>
                                                <span className="text-xs text-muted flex items-center gap-1">
                                                    <span>مشاهدة الفيديو</span>
                                                    <span>←</span>
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-sm line-clamp-2 group-hover:text-[var(--color-primary-light)] transition-colors">
                                                {video.title}
                                            </h3>
                                            {video.description && (
                                                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                                    {video.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination if totalPages > 1 */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mb-3xl">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                    const isCurrent = p === currentPage;
                                    const queryParams = new URLSearchParams();
                                    if (selectedCategory !== 'الكل') queryParams.set('category', selectedCategory);
                                    if (p > 1) queryParams.set('page', p.toString());
                                    const href = `/learn/videos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

                                    return (
                                        <Link
                                            key={p}
                                            href={href}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                                                isCurrent
                                                    ? 'bg-[var(--color-primary)] text-white'
                                                    : 'bg-[var(--color-bg-secondary)] text-muted hover:text-white border border-[var(--color-border)]'
                                            }`}
                                        >
                                            {p}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <div className="text-center" suppressHydrationWarning>
                            <p className="text-muted mb-md">هل تبحث عن المزيد من المحتوى المقروء؟</p>
                            <div className="flex justify-center gap-md">
                                <Link href="/learn/articles" className="btn btn-outline">
                                    تصفح المقالات
                                </Link>
                                <Link href="/learn/faq" className="btn btn-ghost">
                                    الأسئلة الشائعة
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
