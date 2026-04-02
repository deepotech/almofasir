'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

interface PublicDream {
    id: string;
    slug: string;
    title: string;
    content: string;
    interpretation: string;
    mood: string;
    date: string;
    tags: string[];
}

// ─── UI States ────────────────────────────────────────────────────────────────
type PageState = 'loading' | 'error' | 'empty' | 'ready';

export default function InterpretedDreamsPage() {
    const [dreams, setDreams] = useState<PublicDream[]>([]);
    const [pageState, setPageState] = useState<PageState>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    const fetchDreams = useCallback(async (pageNum: number) => {
        try {
            if (pageNum === 1) setPageState('loading');

            console.log(`[DREAMS PAGE] Fetching public dreams page=${pageNum}...`);

            const res = await fetch(`/api/dreams/public?page=${pageNum}&limit=9`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('[DREAMS PAGE] API error:', res.status, errorData);
                throw new Error(`API returned ${res.status}`);
            }

            const data = await res.json();

            console.log('[DREAMS PAGE] API response:', {
                success: data.success,
                count: data.count,
                dreamsLength: data.dreams?.length,
                hasMore: data.hasMore,
                currentPage: data.currentPage
            });

            if (data.dreams && Array.isArray(data.dreams)) {
                if (pageNum === 1) {
                    // First page: replace all dreams
                    const filtered = filterDuplicates(data.dreams);
                    setDreams(filtered);
                    setPageState(filtered.length === 0 ? 'empty' : 'ready');
                } else {
                    // Subsequent pages: append
                    setDreams(prev => filterDuplicates([...prev, ...data.dreams]));
                    setPageState('ready');
                }
                setHasMore(Boolean(data.hasMore));
            } else {
                setPageState(pageNum === 1 ? 'empty' : 'ready');
                setHasMore(false);
            }

        } catch (error: any) {
            console.error('[DREAMS PAGE] Failed to fetch dreams:', error);
            if (pageNum === 1) {
                setPageState('error');
                setErrorMessage(error?.message || 'حدث خطأ أثناء تحميل البيانات');
            }
            // On append pages, silently stop loading more
            setHasMore(false);
        }
    }, []);

    useEffect(() => {
        fetchDreams(1);
    }, [fetchDreams]);

    const filterDuplicates = (dreams: PublicDream[]) => {
        const uniqueIds = new Set<string>();
        return dreams.filter(dream => {
            if (!dream?.id || uniqueIds.has(dream.id)) return false;
            uniqueIds.add(dream.id);
            return true;
        });
    };

    const lastDreamElementRef = useCallback((node: HTMLAnchorElement) => {
        if (pageState === 'loading') return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchDreams(nextPage);
                    return nextPage;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [pageState, hasMore, fetchDreams]);

    const handleRetry = () => {
        setPage(1);
        setDreams([]);
        setHasMore(true);
        fetchDreams(1);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen pb-16" style={{ paddingTop: 120 }}>
                <div className="container px-4">
                    {/* Hero Section */}
                    <div className="text-center mb-8 sm:mb-12 md:mb-16 relative px-4">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[var(--color-primary)]/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 leading-snug">
                            <span className="text-gradient">أحلام حقيقية وتفسيرها</span>
                            <br />
                            <span className="text-lg sm:text-2xl md:text-4xl text-white mt-2 sm:mt-4 block font-bold">تفسيرات حقيقية لأحلام الزوار</span>
                        </h1>
                        <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed sm:leading-loose opacity-90">
                            مجموعة من الأحلام الواقعية التي فُسرت باستخدام الذكاء الاصطناعي، مع مراجعة رمزية دقيقة، وحماية كاملة لخصوصية أصحابها.
                        </p>
                        <Link href="/" className="btn btn-primary btn-lg shadow-lg hover:shadow-primary/20 transition-all">
                            فسّر حلمك الآن
                        </Link>
                    </div>

                    {/* ── Loading State ── */}
                    {pageState === 'loading' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="glass-card h-56 animate-pulse bg-white/5 rounded-2xl border border-white/5" />
                            ))}
                        </div>
                    )}

                    {/* ── Error State ── */}
                    {pageState === 'error' && (
                        <div className="text-center py-20 animate-fadeIn">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-white mb-2">حدث خطأ أثناء تحميل البيانات</h3>
                            <p className="text-[var(--color-text-muted)] mb-6">
                                تعذّر الاتصال بقاعدة البيانات. تحقق من الاتصال أو حاول مجدداً.
                            </p>
                            <button
                                onClick={handleRetry}
                                className="btn btn-primary"
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    )}

                    {/* ── Empty State ── */}
                    {pageState === 'empty' && (
                        <div className="text-center py-20 text-[var(--color-text-muted)]">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-lg mb-2">لا توجد أحلام منشورة حتى الآن.</p>
                            <p className="text-sm mb-6">الأحلام تظهر هنا بعد مراجعة الجودة والنشر.</p>
                            <Link href="/" className="btn btn-secondary mt-4">كن أول من يشارك حلمه</Link>
                        </div>
                    )}

                    {/* ── Dreams Grid (Ready) ── */}
                    {pageState === 'ready' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                                {dreams.map((dream, index) => {
                                    const isLast = index === dreams.length - 1;
                                    return (
                                        <Link
                                            href={`/${dream.slug}`}
                                            key={dream.id}
                                            ref={isLast ? lastDreamElementRef : null}
                                            className="glass-card flex flex-col h-full animate-fadeIn hover:bg-white/5 transition-all group"
                                            style={{ animationDelay: `${Math.min(index, 5) * 0.1}s` }}
                                        >
                                            <div className="mb-4 text-center">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-full">
                                                        {dream.date ? new Date(dream.date).toLocaleDateString('ar-SA') : '—'}
                                                    </span>
                                                    {dream.mood && (
                                                        <span className="text-xl" title="المزاج">{
                                                            dream.mood === 'happy' ? '😊' :
                                                                dream.mood === 'sad' ? '😔' :
                                                                    dream.mood === 'anxious' ? '😰' : '😐'
                                                        }</span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-[var(--color-gold)] line-clamp-2 leading-relaxed group-hover:text-[var(--color-primary)] transition-colors">
                                                    {dream.title || 'حلم مفسر'}
                                                </h3>
                                                <p className="text-base text-[var(--color-text-secondary)] line-clamp-3 mb-5 leading-loose opacity-90">
                                                    {dream.content || '...'}
                                                </p>

                                                {dream.tags && dream.tags.length > 0 && (
                                                    <div className="flex gap-2 flex-wrap justify-center">
                                                        {dream.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="tag text-xs px-2 py-1 bg-[var(--color-bg-secondary)] border-transparent">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                                                <span className="text-xs text-[var(--color-text-muted)]">
                                                    🤖 تفسير AI
                                                </span>
                                                <span className="text-sm text-[var(--color-primary)] font-medium group-hover:underline">
                                                    اقرأ التفسير ←
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Load More Spinner */}
                            {hasMore && (
                                <div className="flex justify-center mt-8 mb-16">
                                    <span className="loading-spinner w-8 h-8"></span>
                                </div>
                            )}

                            {!hasMore && dreams.length > 0 && (
                                <div className="text-center text-[var(--color-text-muted)] text-sm py-8">
                                    — لا يوجد المزيد من الأحلام —
                                </div>
                            )}
                        </>
                    )}

                    {/* Trust Signals */}
                    <div className="border-t border-[var(--color-border)] pt-12 pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="p-4">
                                <div className="text-2xl mb-2">🔒</div>
                                <h4 className="font-bold mb-1">خصوصية تامة</h4>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    نحترم الخصوصية ولا ننشر أي حلم إلا بعد موافقة صاحبه وتنقيحه من البيانات الشخصية.
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="text-2xl mb-2">🤖</div>
                                <h4 className="font-bold mb-1">ذكاء اصطناعي متطور</h4>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    نستخدم أحدث النماذج اللغوية لفهم الرموز والسياق بدقة عالية.
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="text-2xl mb-2">💡</div>
                                <h4 className="font-bold mb-1">تفسير استرشادي</h4>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    التفسير هو اجتهاد للاستئناس وليس فتوى شرعية، والله أعلم.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
