'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const videos = [
    {
        title: "أساسيات تعبير الرؤى",
        duration: "10:30",
        views: "1.2k",
        thumbnail: "🎬",
        category: "تعليمي"
    },
    {
        title: "الفرق بين الحلم والرؤيا",
        duration: "05:45",
        views: "850",
        thumbnail: "✨",
        category: "مفاهيم"
    },
    {
        title: "رموز كثرة رؤيتها في المنام",
        duration: "15:20",
        views: "2.5k",
        thumbnail: "🔑",
        category: "رموز"
    },
    {
        title: "آداب الرائي والمفسر",
        duration: "08:15",
        views: "900",
        thumbnail: "📜",
        category: "آداب"
    },
    {
        title: "هل تتحقق الأحلام السيئة؟",
        duration: "06:00",
        views: "3.1k",
        thumbnail: "🛡️",
        category: "تساؤلات"
    },
    {
        title: "تاريخ علم تفسير الأحلام",
        duration: "12:00",
        views: "1.5k",
        thumbnail: "📚",
        category: "تاريخ"
    }
];

export default function VideosPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-3xl" suppressHydrationWarning>
                            <h1 className="mb-md">🎬 مكتبة الفيديو</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                مقاطع مرئية تعليمية وتثقيفية حول علم تفسير الأحلام.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-3xl" suppressHydrationWarning>
                            {videos.map((video, idx) => (
                                <div key={idx} className="card hover-card" suppressHydrationWarning>
                                    <div className="aspect-video bg-[var(--color-bg-secondary)] flex items-center justify-center text-4xl mb-md rounded-lg relative overflow-hidden group cursor-pointer">
                                        <div className="transition-transform duration-300 group-hover:scale-110">
                                            {video.thumbnail}
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                ▶️
                                            </span>
                                        </div>
                                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </span>
                                    </div>
                                    <div suppressHydrationWarning>
                                        <div className="flex justify-between items-start mb-sm">
                                            <span className="text-xs text-[var(--color-primary-light)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                                                {video.category}
                                            </span>
                                            <span className="text-xs text-muted">
                                                👁️ {video.views}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-sm line-clamp-2">{video.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

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
