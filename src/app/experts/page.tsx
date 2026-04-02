'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { HumanInterpreter, humanInterpreters } from '@/data/human_interpreters';
import { normalizeInterpreter } from '@/lib/dataHelpers';

// ─── UI States ───────────────────────────────────────────────────────────────
type PageState = 'loading' | 'error' | 'empty' | 'ready';

export default function ExpertsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [minRating, setMinRating] = useState<boolean>(false);
    const [speedFilter, setSpeedFilter] = useState<string>('all');

    // State for interpreters data
    const [interpreters, setInterpreters] = useState<HumanInterpreter[]>([]);
    const [pageState, setPageState] = useState<PageState>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Fetch from API
    useEffect(() => {
        const fetchInterpreters = async () => {
            setPageState('loading');
            setErrorMessage('');

            try {
                console.log('[EXPERTS PAGE] Fetching interpreters from API...');

                const res = await fetch('/api/interpreters');

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('[EXPERTS PAGE] API error:', res.status, errorData);
                    throw new Error(`API returned ${res.status}: ${errorData?.error || res.statusText}`);
                }

                const data = await res.json();

                console.log('[EXPERTS PAGE] API response:', {
                    success: data.success,
                    count: data.count,
                    total: data.total,
                    interpretersLength: data.interpreters?.length
                });

                const rawList = data.interpreters || [];

                if (rawList.length === 0) {
                    console.warn('[EXPERTS PAGE] API returned 0 interpreters — falling back to static data');
                    // Fallback to static human interpreters if DB is empty
                    setInterpreters(humanInterpreters);
                    setPageState('ready');
                    return;
                }

                // Map API data to UI model using normalizeInterpreter
                const mapped = rawList.map((i: any) => normalizeInterpreter(i));

                console.log(`[EXPERTS PAGE] Mapped ${mapped.length} interpreters successfully`);
                setInterpreters(mapped);
                setPageState('ready');

            } catch (err: any) {
                console.error('[EXPERTS PAGE] Failed to fetch interpreters:', err);
                setErrorMessage(err?.message || 'حدث خطأ غير متوقع');

                // On error: fallback to static data so the page isn't completely empty
                console.warn('[EXPERTS PAGE] Using static fallback data due to error');
                setInterpreters(humanInterpreters);
                setPageState('ready');
            }
        };

        fetchInterpreters();
    }, []);

    // ─── Filter Logic ──────────────────────────────────────────────────────
    const filteredInterpreters = useMemo(() => {
        return interpreters.filter((interpreter) => {
            // 1. Search (Name or Title)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const nameMatch = interpreter.name?.toLowerCase().includes(query);
                const titleMatch = interpreter.title?.toLowerCase().includes(query);
                const bioMatch = interpreter.bio?.toLowerCase().includes(query);
                if (!nameMatch && !titleMatch && !bioMatch) return false;
            }

            // 2. Type
            if (selectedType !== 'all') {
                if (!interpreter.types?.includes(selectedType as any)) return false;
            }

            // 3. Price — FIXED: labels now match the actual filter thresholds
            if (priceRange !== 'all') {
                const price = interpreter.price ?? 0;
                if (priceRange === 'low' && price >= 30) return false;       // أقل من 30$
                if (priceRange === 'medium' && (price < 30 || price > 70)) return false;  // 30$-70$
                if (priceRange === 'high' && price <= 70) return false;      // أكثر من 70$
            }

            // 4. Rating
            if (minRating && (interpreter.rating ?? 0) < 4) return false;

            // 5. Speed
            if (speedFilter !== 'all') {
                if (interpreter.responseSpeed !== speedFilter) return false;
            }

            return true;
        })
            // Smart Sorting
            .sort((a, b) => {
                if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
                if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);

                const speedVal = (s: string) => s === '6h' ? 1 : s === '24h' ? 2 : 3;
                if (speedVal(a.responseSpeed) !== speedVal(b.responseSpeed))
                    return speedVal(a.responseSpeed) - speedVal(b.responseSpeed);

                return (a.price ?? 0) - (b.price ?? 0);
            });
    }, [interpreters, searchQuery, selectedType, priceRange, minRating, speedFilter]);

    const handleSelectInterpreter = (id: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selected_human_interpreter', id);
        }
        router.push(`/booking?interpreter=${id}`);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setPriceRange('all');
        setSpeedFilter('all');
        setMinRating(false);
    };

    // ─── Derived state ────────────────────────────────────────────────────
    const hasActiveFilters = searchQuery !== '' || selectedType !== 'all' || priceRange !== 'all' || speedFilter !== 'all' || minRating;
    const isLoading = pageState === 'loading';

    return (
        <>
            <Header />
            <main className="min-h-screen pb-20 bg-[var(--color-bg-primary)]">

                {/* SPACER FOR FIXED HEADER */}
                <div className="h-[90px] w-full" aria-hidden="true" />

                {/* 1. Hero Section */}
                <section className="relative pt-12 pb-12 text-center px-4 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-primary)]/10 via-transparent to-transparent pointer-events-none z-0" />
                    <div className="relative z-10 container mx-auto">
                        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-6 animate-fadeIn">
                            <span className="block bg-black/80 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest">
                                🌟 خبراء التفسير
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 animate-fadeIn text-white drop-shadow-2xl">
                            نخبة من <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary-light)]">المفسرين المعتمدين</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-8 animate-fadeIn delay-100 font-medium leading-relaxed">
                            اختر مفسرك الخاص بناءً على التقييمات، التخصص، وسرعة الرد. خصوصية تامة ودقة في التفسير.
                        </p>
                    </div>
                </section>

                {/* 2. Filters Bar */}
                <div className="sticky top-[70px] z-30 px-4 mb-20 transition-all duration-300 pointer-events-none">
                    <div className="container mx-auto max-w-5xl pointer-events-auto">
                        <div className="bg-[#0f172a] border border-white/20 shadow-2xl rounded-3xl p-4 md:p-6 transition-all">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Search */}
                                <div className="md:col-span-4 relative group">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors text-lg">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="ابحث عن مفسر بالاسم..."
                                        className="w-full bg-black/40 text-white placeholder-gray-500 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-[var(--color-primary)]/50 focus:bg-black/60 transition-all font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Filters Group */}
                                <div className="md:col-span-8 flex flex-wrap gap-3 items-center justify-end">
                                    {/* Type Filter */}
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]/50 cursor-pointer hover:bg-white/5 transition-colors font-medium appearance-none"
                                        style={{ minWidth: '140px' }}
                                    >
                                        <option value="all">📚 كل التخصصات</option>
                                        <option value="religious">شرعي</option>
                                        <option value="psychological">نفسي</option>
                                        <option value="symbolic">رمزي</option>
                                        <option value="mixed">شامل</option>
                                    </select>

                                    {/* Price Filter — FIXED labels match filter thresholds */}
                                    <select
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value)}
                                        className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]/50 cursor-pointer hover:bg-white/5 transition-colors font-medium"
                                        style={{ minWidth: '130px' }}
                                    >
                                        <option value="all">💰 كل الأسعار</option>
                                        <option value="low">أقل من 30$</option>
                                        <option value="medium">30$ - 70$</option>
                                        <option value="high">أكثر من 70$</option>
                                    </select>

                                    {/* Speed Filter */}
                                    <select
                                        value={speedFilter}
                                        onChange={(e) => setSpeedFilter(e.target.value)}
                                        className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-primary)]/50 cursor-pointer hover:bg-white/5 transition-colors font-medium"
                                        style={{ minWidth: '130px' }}
                                    >
                                        <option value="all">⏱️ وقت الرد</option>
                                        <option value="6h">⚡ خلال 6 ساعات</option>
                                        <option value="24h">🕑 خلال 24 ساعة</option>
                                        <option value="48h">🕤 خلال 48 ساعة</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Interpreters List */}
                <section className="container mx-auto px-4 min-h-[400px]">

                    {/* Loading Skeleton */}
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white/5 rounded-3xl h-80 animate-pulse border border-white/5" />
                            ))}
                        </div>
                    )}

                    {/* Data ready, has results */}
                    {!isLoading && filteredInterpreters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredInterpreters.map((interpreter, index) => {
                                const isTopRated = (interpreter.rating ?? 0) >= 4.8;
                                const isSwiftReply = interpreter.responseSpeed === '6h';
                                const isRecommended = index === 0 && !searchQuery && selectedType === 'all';

                                return (
                                    <div
                                        key={interpreter.id}
                                        className={`group relative bg-[var(--color-bg-card)] border rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(var(--color-primary-rgb),0.3)] transition-all duration-300 flex flex-col hover:-translate-y-2 ${isRecommended ? 'border-[var(--color-secondary)] shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] ring-1 ring-[var(--color-secondary)]/30' : 'border-white/10 hover:border-[var(--color-primary)]/50'}`}
                                    >
                                        {/* Highlight Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        {/* Badges */}
                                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex gap-1 sm:gap-2">
                                            {isRecommended && (
                                                <div className="bg-gradient-to-r from-[var(--color-secondary)] to-yellow-600 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                                                    <span>⭐</span> الأفضل
                                                </div>
                                            )}
                                            {isTopRated && !isRecommended && (
                                                <div className="hidden sm:block bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-200 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                    💎 أعلى تقييم
                                                </div>
                                            )}
                                            {isSwiftReply && (
                                                <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-200 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                                                    <span>⚡</span> <span className="hidden sm:inline">رد سريع</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Header */}
                                        <div className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-4 flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10">
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 sm:w-16 md:w-20 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl bg-[var(--color-bg-tertiary)] border-2 border-white/10 group-hover:border-[var(--color-primary)]/50 transition-colors flex items-center justify-center text-2xl sm:text-3xl md:text-4xl overflow-hidden shadow-2xl">
                                                    {interpreter.avatar && (interpreter.avatar.startsWith('/') || interpreter.avatar.startsWith('http') || interpreter.avatar.startsWith('data:')) ? (
                                                        <img src={interpreter.avatar} alt={interpreter.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <span className="transform group-hover:scale-110 transition-transform duration-300">{interpreter.avatar || '👤'}</span>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 sm:border-4 border-[var(--color-bg-card)] ${interpreter.status === 'busy' ? 'bg-red-500' : interpreter.status === 'offline' ? 'bg-gray-500' : 'bg-green-500'}`} title={interpreter.status === 'busy' ? 'مشغول' : interpreter.status === 'offline' ? 'غير متاح' : 'متاح'} />
                                            </div>

                                            {/* Name & Title */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-base sm:text-lg md:text-xl text-white group-hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 truncate">
                                                    {interpreter.name || 'مفسر'}
                                                    {interpreter.isVerified && <span className="text-blue-400 text-xs sm:text-sm bg-blue-500/10 p-0.5 sm:p-1 rounded-full" title="موثق">✓</span>}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{interpreter.title || 'مفسر أحلام'}</p>
                                                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-yellow-400 text-xs sm:text-sm font-bold bg-yellow-400/10 px-1.5 sm:px-2 py-0.5 rounded-lg w-fit">
                                                    <span>★</span> {interpreter.rating ?? 'جديد'}
                                                    <span className="text-gray-500 font-normal text-[10px] sm:text-xs ml-1">({interpreter.reviewsCount ?? 0})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div className="hidden sm:block px-6 md:px-8 py-2 flex-grow relative z-10">
                                            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 h-[3em]">
                                                {interpreter.bio || 'مفسر أحلام معتمد'}
                                            </p>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="hidden sm:grid px-6 md:px-8 py-4 md:py-5 grid-cols-2 gap-4 text-center border-t border-white/5 mt-4 md:mt-6 bg-black/20">
                                            <div>
                                                <div className="text-white font-bold text-base md:text-lg mb-1">{interpreter.completedDreams ?? 0}+</div>
                                                <div className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">حلم مفسر</div>
                                            </div>
                                            <div className="border-r border-white/5">
                                                <div className="text-[var(--color-primary-light)] font-bold text-base md:text-lg mb-1">
                                                    {interpreter.responseSpeed === '6h' ? '6 ساعات' : interpreter.responseSpeed === '24h' ? '24 ساعة' : '48 ساعة'}
                                                </div>
                                                <div className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">سرعة الرد</div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-3 sm:p-4 md:p-6 bg-black/40 border-t border-white/5 flex flex-col gap-2 sm:gap-4 relative z-10 backdrop-blur-sm mt-auto">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">السعر</span>
                                                    <span className="text-lg sm:text-xl md:text-2xl font-black text-white">
                                                        {interpreter.price ?? '—'} <span className="text-[10px] sm:text-xs font-medium text-gray-500">{interpreter.currency ?? '$'}</span>
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleSelectInterpreter(String(interpreter.id))}
                                                    disabled={interpreter.status === 'offline'}
                                                    className={`btn px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1 sm:gap-2 ${isRecommended ? 'bg-gradient-to-r from-[var(--color-secondary)] to-yellow-600 border-none text-white hover:shadow-yellow-500/20' : 'btn-primary hover:shadow-[var(--color-primary)]/30'}`}
                                                >
                                                    {interpreter.status === 'offline' ? 'غير متاح' : 'احجز'}
                                                    <span className="text-base sm:text-lg">←</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty state — no results for current filters */}
                    {!isLoading && filteredInterpreters.length === 0 && interpreters.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn bg-white/5 rounded-3xl border border-white/10 p-12">
                            <div className="text-7xl mb-6 opacity-30 grayscale">🕵️</div>
                            <h3 className="text-2xl font-bold mb-3 text-white">لم نعثر على مفسرين مطابقين</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">لم نجد مفسرين بهذه المواصفات حالياً. جرب تغيير خيارات البحث أو إزالة بعض الفلاتر.</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="btn btn-outline text-white hover:bg-white hover:text-black transition-colors"
                                >
                                    عرض جميع المفسرين
                                </button>
                            )}
                        </div>
                    )}

                    {/* Empty state — truly no interpreters at all */}
                    {!isLoading && interpreters.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn bg-white/5 rounded-3xl border border-white/10 p-12">
                            <div className="text-7xl mb-6 opacity-30">🌙</div>
                            <h3 className="text-2xl font-bold mb-3 text-white">لا يوجد مفسرون متاحون حالياً</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">نعمل على إضافة مفسرين معتمدين قريباً. يمكنك في الوقت الحالي استخدام خاصية التفسير الآلي.</p>
                            <a href="/" className="btn btn-primary">تفسير آلي فوري</a>
                        </div>
                    )}
                </section>

                {/* Footer Note */}
                <div className="text-center mt-24 mb-12 text-gray-500 text-sm px-4 max-w-xl mx-auto border-t border-white/5 pt-8">
                    <p>جميع المفسرين في المنصة معتمدون ويخضعون لرقابة الجودة الدورية. حقوقك محفوظة وضمان استرجاع المبلغ في حال عدم الرضا.</p>
                </div>

            </main>
            <Footer />
        </>
    );
}
