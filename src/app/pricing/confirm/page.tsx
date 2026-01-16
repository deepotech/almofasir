'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Zap, User as UserIcon, Shield, Lock, Clock, ArrowRight, ArrowLeft, Check } from 'lucide-react';

import { PLANS } from '@/lib/pricing';

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[]; duration: string }> = {
    'ai-single': {
        name: PLANS['ai-single'].name,
        price: `$${PLANS['ai-single'].price}`,
        features: PLANS['ai-single'].features,
        duration: 'صلاحية 30 يوم (بدون تجديد تلقائي)'
    },
    'ai-monthly': {
        name: PLANS['ai-monthly'].name,
        price: `$${PLANS['ai-monthly'].price}/شهرياً`,
        features: PLANS['ai-monthly'].features,
        duration: 'اشتراك شهري (يمكنك التوقف في أي وقت)'
    },
    'human-single': {
        name: PLANS['human-single'].name,
        price: `$${PLANS['human-single'].priceFrom}`,
        features: PLANS['human-single'].features,
        duration: 'استخدام واحد (بدون تجديد تلقائي)'
    }
};

function ConfirmContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const method = searchParams.get('method') as 'ai' | 'human' | null;
    const planId = searchParams.get('plan');

    // Redirect if no valid selection
    if (!method || !planId || !PLAN_DETAILS[planId]) {
        if (typeof window !== 'undefined') {
            router.push('/pricing');
        }
        return null;
    }

    const plan = PLAN_DETAILS[planId];
    const isAI = method === 'ai';

    const handleConfirm = () => {
        if (!user) {
            router.push(`/auth/register?redirect=/checkout?method=${method}&plan=${planId}`);
        } else {
            router.push(`/checkout?method=${method}&plan=${planId}`);
        }
    };

    const handleBack = () => {
        router.push(`/pricing/plan?method=${method}`);
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
            <Header />

            <main className="container mx-auto px-4 pb-12" style={{ paddingTop: 120 }}>

                {/* Progress Indicator */}
                <div className="w-full max-w-md mx-auto mb-12">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="text-gray-400">١. الاختيار</span>
                        <span className="text-gray-400">٢. الشرح</span>
                        <span className="text-gray-400">٣. الخيارات</span>
                        <span className={isAI ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>٤. التأكيد</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full w-full rounded-full ${isAI ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}></div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        تأكيد اختيارك
                    </h1>
                    <p className="text-lg text-gray-400">
                        راجع ما ستحصل عليه قبل المتابعة
                    </p>
                </div>

                {/* Summary Card */}
                <div className={`max-w-lg mx-auto rounded-2xl p-8 mb-8 border-2 ${isAI ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-emerald-600/5 border-emerald-500/30'}`}>

                    {/* Plan Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isAI ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isAI ? <Zap size={28} /> : <UserIcon size={28} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className={`text-2xl font-bold ${isAI ? 'text-indigo-400' : 'text-emerald-400'}`}>{plan.price}</p>
                        </div>
                    </div>

                    {/* What You Get */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-400 mb-3">ما ستحصل عليه:</h4>
                        <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check size={16} className={isAI ? 'text-indigo-400' : 'text-emerald-400'} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Duration - Highlights "No Auto Renew" or "Cancel Anytime" */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 p-3 bg-gray-800/30 rounded-lg">
                        <Clock size={16} className="text-gray-300" />
                        <span>{plan.duration}</span>
                    </div>

                    {/* Privacy Reassurance */}
                    <div className="space-y-3 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Lock size={16} className="text-green-500" />
                            <span>حلمك خاص ولا يُنشر دون إذنك</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Shield size={16} className="text-green-500" />
                            <span>لن يتم الخصم إلا مرة واحدة</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Check size={16} className="text-green-500" />
                            <span>يمكنك حذف البيانات في أي وقت</span>
                        </div>
                    </div>
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
                        onClick={handleConfirm}
                        className={`
                            group px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-lg text-white
                            ${isAI
                                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                            }
                        `}
                    >
                        <span>المتابعة بثقة</span>
                        <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={20} />
                    </button>
                </div>

            </main>
            <Footer />
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <ConfirmContent />
        </Suspense>
    );
}
