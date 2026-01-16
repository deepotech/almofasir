'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Check, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

function PlanContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const method = searchParams.get('method') as 'ai' | 'human' | null;
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Redirect if no method selected
    if (!method) {
        if (typeof window !== 'undefined') {
            router.push('/pricing');
        }
        return null;
    }

    const handleContinue = () => {
        if (!selectedPlan) return;
        router.push(`/pricing/confirm?method=${method}&plan=${selectedPlan}`);
    };

    const handleBack = () => {
        router.push(`/pricing/value?method=${method}`);
    };

    const isAI = method === 'ai';

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
            <Header />

            <main className="container mx-auto px-4 pb-12" style={{ paddingTop: 120 }}>

                {/* Progress Indicator */}
                <div className="w-full max-w-md mx-auto mb-12">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="text-gray-400">١. الاختيار</span>
                        <span className="text-gray-400">٢. الشرح</span>
                        <span className={isAI ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>٣. الخيارات</span>
                        <span>٤. التأكيد</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full w-3/4 rounded-full ${isAI ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}></div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        {isAI ? 'اختر ما يناسبك الآن، ويمكنك التغيير لاحقًا' : 'هذا التفسير يتطلب وقتًا ومراجعة بشرية دقيقة'}
                    </h1>
                </div>

                {/* Pricing Options */}
                <div className={`max-w-3xl mx-auto mb-12 ${isAI ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex justify-center flex-col items-center'}`}>

                    {isAI ? (
                        <>
                            {/* AI Option 1: Single */}
                            <button
                                onClick={() => setSelectedPlan('ai-single')}
                                className={`
                                    relative p-8 rounded-2xl text-right transition-all duration-300 border-2 w-full
                                    ${selectedPlan === 'ai-single'
                                        ? 'bg-indigo-600/10 border-indigo-500'
                                        : 'bg-[rgba(255,255,255,0.02)] border-gray-800 hover:border-gray-600'
                                    }
                                `}
                            >
                                <h3 className="text-xl font-bold mb-2 text-white">تفسير واحد</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-white">$2.99</span>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-400 mb-4">
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-indigo-400" />
                                        <span>تفسير واحد لحلم واحد</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-indigo-400" />
                                        <span>استخدام فوري لمرة واحدة</span>
                                    </li>
                                </ul>

                                {/* Selection Indicator */}
                                <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${selectedPlan === 'ai-single' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}
                                `}>
                                    {selectedPlan === 'ai-single' && (
                                        <Check size={14} className="text-white" />
                                    )}
                                </div>
                            </button>

                            {/* AI Option 2: Monthly */}
                            <button
                                onClick={() => setSelectedPlan('ai-monthly')}
                                className={`
                                    relative p-8 rounded-2xl text-right transition-all duration-300 border-2 w-full
                                    ${selectedPlan === 'ai-monthly'
                                        ? 'bg-indigo-600/10 border-indigo-500'
                                        : 'bg-[rgba(255,255,255,0.02)] border-gray-800 hover:border-gray-600'
                                    }
                                `}
                            >
                                {/* Recommended Badge */}
                                <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <span>💡</span>
                                    <span>موصى به</span>
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-white">باقة شهرية</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-white">$9.99</span>
                                    <span className="text-sm text-gray-400 mr-1">/ شهرياً</span>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-400 mb-4">
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-indigo-400" />
                                        <span>عدة تفسيرات (10 أحلام)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-indigo-400" />
                                        <span>سجل أحلام منظم</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-indigo-400" />
                                        <span>راحة المتابعة والأولوية</span>
                                    </li>
                                </ul>

                                {/* Selection Indicator */}
                                <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${selectedPlan === 'ai-monthly' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}
                                `}>
                                    {selectedPlan === 'ai-monthly' && (
                                        <Check size={14} className="text-white" />
                                    )}
                                </div>
                            </button>
                        </>
                    ) : (
                        /* Human Option: Single */
                        <div className="w-full max-w-md">
                            <button
                                onClick={() => setSelectedPlan('human-single')}
                                className={`
                                    relative p-8 rounded-2xl text-right transition-all duration-300 border-2 w-full
                                    ${selectedPlan === 'human-single'
                                        ? 'bg-emerald-600/10 border-emerald-500'
                                        : 'bg-[rgba(255,255,255,0.02)] border-gray-800 hover:border-gray-600'
                                    }
                                `}
                            >
                                <h3 className="text-xl font-bold mb-2 text-white">تفسير واحد من مفسر مختص</h3>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">$14.99</span>
                                    <span className="text-sm text-gray-400 mr-1">/ للحلم الواحد</span>
                                </div>

                                <ul className="space-y-3 text-sm text-gray-400 mb-6">
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400" />
                                        <span>حلم واحد مفصل</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400" />
                                        <span>رد خلال 24-48 ساعة</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400" />
                                        <span>مراجعة بشرية كاملة</span>
                                    </li>
                                </ul>

                                {/* Selection Indicator */}
                                <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${selectedPlan === 'human-single' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'}
                                `}>
                                    {selectedPlan === 'human-single' && (
                                        <Check size={14} className="text-white" />
                                    )}
                                </div>
                            </button>

                            {/* Scarcity Warning */}
                            <div className="mt-4 flex items-start gap-3 p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20">
                                <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-500/80 leading-relaxed">
                                    بسبب محدودية وقت المفسرين، هذا الخيار غير متاح دائمًا.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-full font-medium text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        <span>رجوع</span>
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!selectedPlan}
                        className={`
                            group px-10 py-3 rounded-full font-bold transition-all flex items-center gap-3 shadow-lg
                            ${selectedPlan
                                ? isAI
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 cursor-pointer'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 cursor-pointer'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }
                        `}
                    >
                        <span>اختيار هذا الخيار</span>
                        <ArrowRight className={`transition-transform ${selectedPlan ? 'group-hover:-translate-x-1' : ''}`} size={18} />
                    </button>
                </div>

            </main>
            <Footer />
        </div>
    );
}

export default function PlanPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <PlanContent />
        </Suspense>
    );
}
