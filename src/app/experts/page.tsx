'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { HumanInterpreter } from '@/data/human_interpreters';

export default function ExpertsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [minRating, setMinRating] = useState<boolean>(false);
    const [speedFilter, setSpeedFilter] = useState<string>('all');

    // State for interpreters data
    const [interpreters, setInterpreters] = useState<HumanInterpreter[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch from API
    useEffect(() => {
        const fetchInterpreters = async () => {
            try {
                const res = await fetch('/api/interpreters');
                if (res.ok) {
                    const data = await res.json();

                    // Map API data to UI model
                    const mapped = data.interpreters.map((i: any) => ({
                        id: i.id,
                        name: i.displayName,
                        title: `مفسر ${i.interpretationTypeAr}`, // Derive title
                        bio: i.bio,
                        isVerified: true, // Default to true for DB users for now
                        isExpert: i.completedDreams > 100, // Logic for expert badge
                        rating: i.rating || 5, // Default rating if new
                        reviewsCount: i.totalRatings || 0,
                        completedDreams: i.completedDreams || 0,
                        responseSpeed: i.responseTime <= 6 ? '6h' : i.responseTime <= 24 ? '24h' : '48h',
                        price: i.price,
                        currency: 'USD', // Fixed currency for now
                        avatar: i.avatar || '👤',
                        types: [i.interpretationType],
                        status: i.isActive ? 'available' : 'busy'
                    }));

                    // Fallback to static if DB is empty (for demo purposes)
                    if (mapped.length === 0) {
                        // Only if strictly needed, but better to show empty state or handle effectively.
                        // For now, let's stick to using the mapped data even if empty to prove the fix.
                        // setInterpreters(humanInterpreters); 
                        setInterpreters([]);
                    } else {
                        setInterpreters(mapped);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch interpreters', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInterpreters();
    }, []);

    // Filter Logic
    const filteredInterpreters = useMemo(() => {
        return interpreters.filter((interpreter) => {
            // 1. Search (Name or Title)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !interpreter.name.toLowerCase().includes(query) &&
                    !interpreter.title.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // 2. Type
            if (selectedType !== 'all') {
                if (!interpreter.types.includes(selectedType as any)) return false;
            }

            // 3. Price
            if (priceRange !== 'all') {
                if (priceRange === 'low' && interpreter.price >= 40) return false;
                if (priceRange === 'medium' && (interpreter.price < 40 || interpreter.price > 60)) return false;
                if (priceRange === 'high' && interpreter.price <= 60) return false;
            }

            // 4. Rating
            if (minRating && interpreter.rating < 4) return false;

            // 5. Speed
            if (speedFilter !== 'all') {
                if (interpreter.responseSpeed !== speedFilter) return false;
            }

            return true;
        })
            // Smart Sorting
            .sort((a, b) => {
                if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
                if (b.rating !== a.rating) return b.rating - a.rating; // Rating Desc

                const speedVal = (s: string) => s === '6h' ? 1 : s === '24h' ? 2 : 3;
                if (speedVal(a.responseSpeed) !== speedVal(b.responseSpeed)) return speedVal(a.responseSpeed) - speedVal(b.responseSpeed);

                return a.price - b.price; // Price Asc
            });
    }, [interpreters, searchQuery, selectedType, priceRange, minRating, speedFilter]);

    const handleSelectInterpreter = (id: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selected_human_interpreter', id);
        }
        // Redirect to booking page
        router.push(`/booking?interpreter=${id}`);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen pb-20 bg-[var(--color-bg-primary)]">

                {/* SPACER FOR FIXED HEADER */}
                <div className="h-[90px] w-full" aria-hidden="true" />

                {/* 1. Hero Section */}
                <section className="relative pt-12 pb-12 text-center px-4 overflow-hidden">
                    {/* Background Glow */}
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
                {/* changed bg to solid hex to prevent transparency overlap */}
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
                                    </select>

                                    {/* Price Filter */}
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
                    {filteredInterpreters.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredInterpreters.map((interpreter, index) => {
                                // Logic for Badges
                                const isTopRated = interpreter.rating >= 4.8;
                                const isSwiftReply = interpreter.responseSpeed === '6h';
                                const isRecommended = index === 0 && !searchQuery && selectedType === 'all';

                                return (
                                    <div
                                        key={interpreter.id}
                                        className={`group relative bg-[var(--color-bg-card)] border rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(var(--color-primary-rgb),0.3)] transition-all duration-300 flex flex-col hover:-translate-y-2 ${isRecommended ? 'border-[var(--color-secondary)] shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] ring-1 ring-[var(--color-secondary)]/30' : 'border-white/10 hover:border-[var(--color-primary)]/50'}`}
                                    >
                                        {/* Highlight Effect for All Cards */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        {/* Badges Container */}
                                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                                            {isRecommended && (
                                                <div className="bg-gradient-to-r from-[var(--color-secondary)] to-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                    <span>⭐</span> الأفضل
                                                </div>
                                            )}
                                            {isTopRated && !isRecommended && (
                                                <div className="bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-200 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                    💎 أعلى تقييم
                                                </div>
                                            )}
                                            {isSwiftReply && (
                                                <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-200 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                    <span>⚡</span> رد سريع
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Header */}
                                        <div className="p-8 pb-4 flex items-center gap-6 relative z-10">
                                            {/* Avatar with Status Dot */}
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-tertiary)] border-2 border-white/10 group-hover:border-[var(--color-primary)]/50 transition-colors flex items-center justify-center text-4xl overflow-hidden shadow-2xl">
                                                    {interpreter.avatar.startsWith('/') || interpreter.avatar.startsWith('http') || interpreter.avatar.startsWith('data:') ? (
                                                        <img src={interpreter.avatar} alt={interpreter.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <span className="transform group-hover:scale-110 transition-transform duration-300">{interpreter.avatar}</span>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[var(--color-bg-card)] ${interpreter.status === 'busy' ? 'bg-red-500' : 'bg-green-500'}`} title={interpreter.status === 'busy' ? 'مشغول' : 'متاح'} />
                                            </div>

                                            {/* Name & Title */}
                                            <div>
                                                <h3 className="font-bold text-xl text-white group-hover:text-[var(--color-primary-light)] transition-colors flex items-center gap-2 mb-1">
                                                    {interpreter.name}
                                                    {interpreter.isVerified && <span className="text-blue-400 text-sm bg-blue-500/10 p-1 rounded-full" title="موثق">✓</span>}
                                                </h3>
                                                <p className="text-sm text-gray-400 font-medium">{interpreter.title}</p>

                                                <div className="flex items-center gap-1 mt-2 text-yellow-400 text-sm font-bold bg-yellow-400/10 px-2 py-0.5 rounded-lg w-fit">
                                                    <span>★</span> {interpreter.rating}
                                                    <span className="text-gray-500 font-normal text-xs ml-1">({interpreter.reviewsCount})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div className="px-8 py-2 flex-grow relative z-10">
                                            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 h-[3em]">
                                                {interpreter.bio}
                                            </p>
                                        </div>

                                        {/* Info Grid (Stats) */}
                                        <div className="px-8 py-5 grid grid-cols-2 gap-4 text-center border-t border-white/5 mt-6 bg-black/20">
                                            <div>
                                                <div className="text-white font-bold text-lg mb-1">{interpreter.completedDreams}+</div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">حلم مفسر</div>
                                            </div>
                                            <div className="border-r border-white/5">
                                                <div className="text-[var(--color-primary-light)] font-bold text-lg mb-1">
                                                    {interpreter.responseSpeed === '6h' ? '6 ساعات' : interpreter.responseSpeed === '24h' ? '24 ساعة' : '48 ساعة'}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">سرعة الرد</div>
                                            </div>
                                        </div>

                                        {/* Footer: Price & CTA */}
                                        <div className="p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4 relative z-10 backdrop-blur-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 mb-1">سعر الاستشارة</span>
                                                    <span className="text-2xl font-black text-white">
                                                        {interpreter.price} <span className="text-xs font-medium text-gray-500">{interpreter.currency}</span>
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleSelectInterpreter(interpreter.id)}
                                                    disabled={interpreter.status === 'offline'}
                                                    className={`btn px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2 ${isRecommended ? 'bg-gradient-to-r from-[var(--color-secondary)] to-yellow-600 border-none text-white hover:shadow-yellow-500/20' : 'btn-primary hover:shadow-[var(--color-primary)]/30'}`}
                                                >
                                                    {interpreter.status === 'offline' ? 'غير متاح' : 'احجز الآن'}
                                                    <span className="text-lg">←</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn bg-white/5 rounded-3xl border border-white/10 p-12">
                            <div className="text-7xl mb-6 opacity-30 grayscale">🕵️</div>
                            <h3 className="text-2xl font-bold mb-3 text-white">لم نعثر على مفسرين مطابقين</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">لم نجد مفسرين بهذه المواصفات حالياً. جرب تغيير خيارات البحث أو إزالة بعض الفلاتر.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedType('all');
                                    setPriceRange('all');
                                    setSpeedFilter('all');
                                    setMinRating(false);
                                }}
                                className="btn btn-outline text-white hover:bg-white hover:text-black transition-colors"
                            >
                                عرض جميع المفسرين
                            </button>
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
