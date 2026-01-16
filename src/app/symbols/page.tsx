'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { dreamSymbols, symbolCategories, searchSymbols, DreamSymbol } from '@/data/symbols';

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-[var(--color-primary)]/30 text-white rounded px-0.5 font-bold">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default function SymbolsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sceneText, setSceneText] = useState('');
    const [sceneResult, setSceneResult] = useState<DreamSymbol[] | null>(null);

    // Filter symbols based on search and category
    const filteredSymbols = searchQuery
        ? searchSymbols(searchQuery)
        : selectedCategory
            ? dreamSymbols.filter(s => s.category === selectedCategory)
            : dreamSymbols;

    // Analyze scene for multiple symbols
    const analyzeScene = () => {
        if (!sceneText.trim()) return;
        const found = dreamSymbols.filter(symbol =>
            sceneText.includes(symbol.name) ||
            symbol.relatedSymbols.some(rs => sceneText.includes(rs))
        );
        setSceneResult(found);
    };

    return (
        <>
            <Header />

            <main style={{ paddingTop: 100 }}>
                {/* Hero */}
                <section className="section pb-8">
                    <div className="container text-center">
                        <h1 className="mb-6 text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--color-primary-light)]">
                            📚 قاموس تفسير الأحلام
                        </h1>
                        <p className="text-[var(--color-text-secondary)] text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                            ابحث عن أي رمز واكتشف تفسيره حسب ابن سيرين والنابلسي، مع اختلاف المعنى حسب حالتك
                        </p>

                        {/* Search */}
                        <div className="relative max-w-2xl mx-auto mb-12 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all">
                                <span className="mr-5 text-2xl opacity-50">🔍</span>
                                <input
                                    type="text"
                                    className="w-full bg-transparent p-5 text-xl text-white placeholder-gray-500 outline-none"
                                    placeholder="ابحث عن رمز... (مثل: الماء، القطة، القمر)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-4 text-gray-500 hover:text-white transition-colors p-2"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Categories (Smart Chips) */}
                        <div className="flex justify-center gap-3 flex-wrap mb-16">
                            <button
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${!selectedCategory
                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-glow'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                onClick={() => setSelectedCategory(null)}
                            >
                                ✨ الكل
                            </button>
                            {symbolCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-glow transform scale-105'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                        }`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Symbols Grid */}
                <section className="section py-8">
                    <div className="container">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredSymbols.map(symbol => (
                                <Link
                                    href={`/symbols/${symbol.id}`}
                                    key={symbol.id}
                                    className="group relative block h-full"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl blur-xl transition-opacity duration-500" />

                                    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 h-full flex flex-col transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[var(--color-primary)]/50 group-hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.3)] overflow-hidden">

                                        {/* Soft inner glow */}
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-primary)]/20 transition-colors" />

                                        <div className="flex items-start justify-between mb-6 relative">
                                            <div className="text-6xl filter drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                                                {symbol.icon}
                                            </div>
                                            <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--color-text-secondary)] bg-black/20 px-3 py-1 rounded-full border border-white/5 group-hover:border-[var(--color-primary)]/30 transition-colors">
                                                {symbol.relatedSymbols.length} رموز
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[var(--color-primary-light)] transition-colors">
                                            <HighlightText text={symbol.name} highlight={searchQuery} />
                                        </h3>

                                        <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3 group-hover:text-gray-300 transition-colors">
                                            <HighlightText text={symbol.interpretations.general} highlight={searchQuery} />
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[var(--color-primary-light)] opacity-70 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <span>عرض التفسير</span>
                                            <span className="transform transition-transform group-hover:-translate-x-1">←</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {filteredSymbols.length === 0 && (
                            <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <div className="text-6xl mb-4 opacity-50">🔍</div>
                                <h3 className="text-xl font-bold text-white mb-2">لم نعثر على نتائج لـ "{searchQuery}"</h3>
                                <p className="text-muted">حاول البحث عن كلمات أخرى أو تصفح التصنيفات</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-6 btn btn-outline btn-sm"
                                >
                                    مسح البحث
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Scene Analyzer (Premium Feature) */}
                <section className="section py-24 relative overflow-hidden">
                    {/* Dark Cosmic Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-black z-0" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay z-0" />

                    <div className="container relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-block p-1 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-6">
                                <span className="block bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest">
                                    ✨ ميزة جديدة
                                </span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
                                🎬 تفسير مشهد كامل
                            </h2>
                            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                                هل رأيت حلماً معقداً؟ أدخل المشهد كاملاً هنا لنقوم بتحليل الرموز وترابطها ببعضها البعض.
                            </p>

                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[2rem] opacity-20 group-hover:opacity-40 blur transition-opacity duration-500" />

                                <textarea
                                    className="w-full bg-black/40 text-white p-6 rounded-2xl min-h-[160px] text-lg placeholder-gray-500 outline-none border border-transparent focus:border-white/10 focus:bg-black/60 transition-all resize-y relative z-10"
                                    placeholder="مثال: رأيت قطة سوداء تطاردني في البيت ثم خرجت للنور فوجدت حديقة خضراء فيها نهر صافٍ..."
                                    value={sceneText}
                                    onChange={(e) => setSceneText(e.target.value)}
                                />

                                <div className="absolute bottom-6 left-6 z-20">
                                    <button
                                        className="btn btn-primary shadow-glow animate-pulse-slow hover:animate-none transform hover:scale-105 transition-all text-lg px-8 py-3 rounded-xl"
                                        onClick={analyzeScene}
                                    >
                                        ✨ حلل المشهد
                                    </button>
                                </div>
                            </div>

                            {sceneResult && sceneResult.length > 0 && (
                                <div className="mt-16 animate-fadeIn">
                                    <div className="flex items-center justify-center gap-4 mb-8">
                                        <div className="h-px bg-white/10 w-20" />
                                        <h4 className="text-2xl font-bold text-white">📊 الرموز المكتشفة ({sceneResult.length})</h4>
                                        <div className="h-px bg-white/10 w-20" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sceneResult.map(symbol => (
                                            <div key={symbol.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-right hover:bg-white/10 transition-colors">
                                                <div className="flex gap-4 items-center mb-4">
                                                    <span className="text-4xl">{symbol.icon}</span>
                                                    <div>
                                                        <strong className="block text-xl text-white">{symbol.name}</strong>
                                                        <span className="text-xs text-[var(--color-primary-light)]">{symbol.relatedSymbols.length} مرادفات</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                                    {symbol.interpretations.general.substring(0, 80)}...
                                                </p>
                                                <Link href={`/symbols/${symbol.id}`} className="text-[var(--color-primary)] text-sm font-bold hover:underline">
                                                    التفاصيل الكاملة ←
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sceneResult && sceneResult.length === 0 && (
                                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200">
                                    لم يتم العثور على رموز معروفة في هذا المشهد. حاول إضافة المزيد من التفاصيل أو استخدام مصطلحات أخرى.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="section py-32">
                    <div className="container">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">📖 مدرستان للتفسير</h2>
                            <p className="text-muted">نجمع لك بين أصالة التراث وعمق الفهم النفسي</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Religious Card */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#f59e0b]/10 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="relative bg-[var(--color-bg-primary)] border border-[#f59e0b]/20 rounded-3xl p-8 h-full shadow-lg hover:shadow-[0_10px_40px_-10px_rgba(245,158,11,0.2)] transition-all transform hover:-translate-y-2">
                                    <div className="w-20 h-20 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                                        🕌
                                    </div>
                                    <h4 className="text-2xl font-bold text-[#f59e0b] text-center mb-6">التفسير الشرعي</h4>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 flex items-center justify-center text-xs text-[#f59e0b]">✔</span>
                                            <span>مستند إلى القرآن والسنة</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 flex items-center justify-center text-xs text-[#f59e0b]">✔</span>
                                            <span>يعتمد على تراث ابن سيرين والنابلسي</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 flex items-center justify-center text-xs text-[#f59e0b]">✔</span>
                                            <span>يفرّق بين الرؤيا الصادقة والحلم</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 flex items-center justify-center text-xs text-[#f59e0b]">✔</span>
                                            <span>يربط التفسير بالأدعية والأذكار</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Psychological Card */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#8b5cf6]/10 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="relative bg-[var(--color-bg-primary)] border border-[#8b5cf6]/20 rounded-3xl p-8 h-full shadow-lg hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.2)] transition-all transform hover:-translate-y-2">
                                    <div className="w-20 h-20 bg-[#8b5cf6]/10 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                                        🧠
                                    </div>
                                    <h4 className="text-2xl font-bold text-[#8b5cf6] text-center mb-6">التفسير النفسي</h4>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-xs text-[#8b5cf6]">✔</span>
                                            <span>يعتمد على نظريات فرويد ويونغ</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-xs text-[#8b5cf6]">✔</span>
                                            <span>يربط الحلم باللاوعي والمكبوتات</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-xs text-[#8b5cf6]">✔</span>
                                            <span>يحلل الرموز كتعبير عن الذات</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-gray-300">
                                            <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-xs text-[#8b5cf6]">✔</span>
                                            <span>أداة للنمو الشخصي والتأمل</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 text-center max-w-2xl mx-auto p-6 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[var(--color-gold)] font-medium text-lg">
                                💡 في "المُفسِّر"، نقدم لك كلا المنظورين لتكتمل الصورة، مع الحفاظ على الثوابت الشرعية كأساس.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
