import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TikTokEmbed from '@/components/video/TikTokEmbed';
import { getVideoBySlug, getPublishedVideos } from '@/lib/videos';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export const revalidate = 1800; // ISR revalidate every 30 minutes

/**
 * Generate SEO Metadata
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const video = await getVideoBySlug(slug);

    if (!video) {
        return {
            title: 'الفيديو غير موجود | المُفسِّر',
            description: 'المقطع المرئي المطلوب غير متوفر حالياً في مكتبة الفيديو.',
        };
    }

    const title = video.seoTitle || `${video.title} | مكتبة الفيديو - المُفسِّر`;
    const description =
        video.seoDescription ||
        video.description ||
        `شاهد وتعرف على ${video.title} مع شرح وتفسير رمزي دقيق وفق منهج أهل العلم.`;
    const canonicalUrl = `https://almofasir.com/learn/videos/${video.slug}`;


    // Thin Content & SEO Quality Guard: Only index if published and has genuine editorial depth (>= 120 chars)
    const hasEditorialDepth = Boolean(video.articleContent && video.articleContent.trim().length >= 120);
    const shouldIndex = Boolean(video.isPublished && hasEditorialDepth);

    return {
        title,
        description,
        robots: {
            index: shouldIndex,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'video.other',
            siteName: 'المُفسِّر',
            images: video.thumbnailUrl
                ? [
                      {
                          url: video.thumbnailUrl,
                          width: 720,
                          height: 1280,
                          alt: video.title,
                      },
                  ]
                : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: video.thumbnailUrl ? [video.thumbnailUrl] : [],
        },
    };
}


export default async function VideoDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const video = await getVideoBySlug(slug);

    if (!video) {
        notFound();
    }

    // Fetch up to 3 other videos for related suggestions
    const { videos: otherVideos } = await getPublishedVideos({ limit: 4 });
    const relatedVideos = otherVideos.filter((v) => v.slug !== video.slug).slice(0, 3);

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
            {
                '@type': 'ListItem',
                position: 4,
                name: video.title,
                item: `https://almofasir.com/learn/videos/${video.slug}`,
            },
        ],
    };

    // VideoObject Schema (using ONLY genuine real verified data)
    const videoSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.seoDescription || video.description || video.title,
        uploadDate: video.publishedAt,
        contentUrl: video.tiktokUrl,
        embedUrl: `https://www.tiktok.com/embed/v2/${video.tiktokVideoId}`,
        publisher: {
            '@type': 'Organization',
            name: 'المُفسِّر',
            logo: {
                '@type': 'ImageObject',
                url: 'https://almofasir.com/logo.png',
            },
        },
        author: {
            '@type': 'Organization',
            name: video.authorName || 'المُفسِّر',
            url: 'https://www.tiktok.com/@almofasir_',
        },
    };

    if (video.thumbnailUrl) {
        videoSchema.thumbnailUrl = [video.thumbnailUrl];
    }

    // FAQPage Schema if FAQs exist
    const faqSchema =
        video.faq && video.faq.length > 0
            ? {
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: video.faq.map((item) => ({
                      '@type': 'Question',
                      name: item.question,
                      acceptedAnswer: {
                          '@type': 'Answer',
                          text: item.answer,
                      },
                  })),
              }
            : null;

    const formattedDate = video.publishedAt
        ? new Date(video.publishedAt).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <article className="section">
                    <div className="container max-w-4xl mx-auto px-4" suppressHydrationWarning>
                        {/* Breadcrumbs */}
                        <nav
                            aria-label="Breadcrumb"
                            className="flex items-center gap-2 text-xs text-muted mb-6 flex-wrap"
                        >
                            <Link href="/" className="hover:text-[var(--color-primary-light)]">
                                الرئيسية
                            </Link>
                            <span>/</span>
                            <Link href="/learn" className="hover:text-[var(--color-primary-light)]">
                                تعلّم
                            </Link>
                            <span>/</span>
                            <Link href="/learn/videos" className="hover:text-[var(--color-primary-light)]">
                                مكتبة الفيديو
                            </Link>
                            <span>/</span>
                            <span className="text-[var(--color-text)] truncate max-w-[200px]">
                                {video.title}
                            </span>
                        </nav>

                        {/* Title Header */}
                        <header className="mb-8 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-3 flex-wrap justify-center md:justify-start">
                                <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border border-[var(--color-primary)]/30 px-3 py-1 rounded-full font-medium">
                                    {video.category}
                                </span>
                                {formattedDate && (
                                    <span className="text-xs text-muted">
                                        تاريخ النشر: {formattedDate}
                                    </span>
                                )}
                                {video.duration && (
                                    <span className="text-xs text-muted">
                                        ⏱️ المدة: {video.duration}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                                🎬 {video.title}
                            </h1>

                            {video.description && (
                                <p className="text-muted text-base md:text-lg leading-relaxed">
                                    {video.description}
                                </p>
                            )}
                        </header>

                        {/* Official TikTok Embed */}
                        <section className="mb-10">
                            <TikTokEmbed
                                videoId={video.tiktokVideoId}
                                videoUrl={video.tiktokUrl}
                                title={video.title}
                                thumbnailUrl={video.thumbnailUrl}
                            />
                        </section>


                        {/* Key Takeaways: ماذا ستتعلم من هذا الفيديو؟ */}
                        {video.takeaways && video.takeaways.length > 0 && (
                            <section className="card mb-10 p-6 border border-emerald-500/20 bg-emerald-950/10">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                    <span>💡</span>
                                    <span>ماذا ستتعلم من هذا الفيديو؟</span>
                                </h2>
                                <ul className="space-y-3 text-sm md:text-base leading-relaxed">
                                    {video.takeaways.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-emerald-400 mt-1">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Original Editorial Article Content */}
                        {video.articleContent && (
                            <section className="card mb-10 p-6 md:p-8">
                                <h2 className="text-xl md:text-2xl font-bold mb-6 pb-3 border-b border-[var(--color-border)]">
                                    📖 الشرح والتحليل المفصل
                                </h2>
                                <div className="space-y-5 text-muted leading-loose text-base md:text-lg">
                                    {video.articleContent.split('\n\n').map((paragraph, idx) => {
                                        // Check if paragraph is heading
                                        if (paragraph.startsWith('أولاً:') || paragraph.startsWith('ثانياً:') || paragraph.startsWith('ثالثاً:') || paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.')) {
                                            return (
                                                <h3 key={idx} className="text-lg font-bold text-[var(--color-text)] mt-4">
                                                    {paragraph}
                                                </h3>
                                            );
                                        }
                                        return <p key={idx}>{paragraph}</p>;
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Frequently Asked Questions */}
                        {video.faq && video.faq.length > 0 && (
                            <section className="card mb-10 p-6 md:p-8">
                                <h2 className="text-xl md:text-2xl font-bold mb-6 pb-3 border-b border-[var(--color-border)] flex items-center gap-2">
                                    <span>❓</span>
                                    <span>أسئلة شائعة حول محتوى الفيديو</span>
                                </h2>
                                <div className="space-y-6">
                                    {video.faq.map((item, idx) => (
                                        <div key={idx} className="bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
                                            <h3 className="font-bold text-base md:text-lg mb-2 text-[var(--color-text)]">
                                                {item.question}
                                            </h3>
                                            <p className="text-muted text-sm md:text-base leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* High-Converting CTA Box */}
                        <section className="card text-center my-12 p-8 border-2 border-[var(--color-primary)]/40 bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg)] relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-4xl mb-3 block">🌙</span>
                                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                                    هل رأيت شيئاً مشابهاً في منامك؟
                                </h3>
                                <p className="text-muted max-w-xl mx-auto mb-6 text-base md:text-lg leading-relaxed">
                                    لا تعتمد على تفسير عام؛ فتفاصيل الرؤيا وحال الرائي ومشاعره في الحلم قد تغيّر المعنى كلياً.
                                </p>
                                <div className="flex justify-center gap-4 flex-wrap">
                                    <Link
                                        href="/#dream-input"
                                        className="btn btn-primary px-8 py-3 text-lg font-bold shadow-lg hover:shadow-red-500/20 transition-all"
                                    >
                                        ✨ فسّر حلمك الآن مجاناً
                                    </Link>
                                    <Link
                                        href="/experts"
                                        className="btn btn-outline px-6 py-3 text-sm md:text-base"
                                    >
                                        استشر مفسراً معتمداً
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* Internal Linking: قد يهمك أيضاً */}
                        <section className="mb-12">
                            <h3 className="text-xl font-bold mb-4">🔗 استكشف المزيد في المفسر</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <Link
                                    href="/symbols"
                                    className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors block"
                                >
                                    <div className="text-2xl mb-1">📖</div>
                                    <h4 className="font-bold text-sm mb-1">قاموس تفسير الأحلام</h4>
                                    <p className="text-xs text-muted">ابحث في معاني مئات الرموز الشائعة</p>
                                </Link>
                                <Link
                                    href="/tafsir-al-ahlam"
                                    className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors block"
                                >
                                    <div className="text-2xl mb-1">🧭</div>
                                    <h4 className="font-bold text-sm mb-1">دليل تفسير الأحلام</h4>
                                    <p className="text-xs text-muted">المنهج الشامل لفهم الرؤى وتأويلها</p>
                                </Link>
                                <Link
                                    href="/learn/faq"
                                    className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors block"
                                >
                                    <div className="text-2xl mb-1">📜</div>
                                    <h4 className="font-bold text-sm mb-1">الأسئلة الشرعية الشائعة</h4>
                                    <p className="text-xs text-muted">أحكام وآداب الرؤيا في السنة</p>
                                </Link>
                            </div>
                        </section>

                        {/* Related Videos */}
                        {relatedVideos.length > 0 && (
                            <section className="mb-12 border-t border-[var(--color-border)] pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">🎬 فيديوهات ذات صلة</h3>
                                    <Link
                                        href="/learn/videos"
                                        className="text-xs text-[var(--color-primary-light)] hover:underline"
                                    >
                                        عرض كل المقاطع ←
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {relatedVideos.map((item) => (
                                        <Link
                                            key={item.slug}
                                            href={`/learn/videos/${item.slug}`}
                                            className="card hover-card block text-inherit no-underline group"
                                        >
                                            <div className="aspect-video bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden mb-3 relative">
                                                {item.thumbnailUrl ? (
                                                    <img
                                                        src={item.thumbnailUrl}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />

                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">
                                                        🎬
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted block mb-1">
                                                {item.category}
                                            </span>
                                            <h4 className="font-bold text-sm line-clamp-2 group-hover:text-[var(--color-primary-light)] transition-colors">
                                                {item.title}
                                            </h4>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </article>
            </main>

            <Footer />
        </>
    );
}
