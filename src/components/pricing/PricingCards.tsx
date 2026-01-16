'use client';

import { PLANS } from '@/lib/pricing';
import { Check, Zap, Star, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PricingCards() {
    const router = useRouter();

    const handleSelect = (planId: string) => {
        router.push(`/pricing/confirm?method=ai&plan=${planId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">

            {/* Extra Credits - Single (Mobile Order: 2, Desktop Order: 1) */}
            <div className="order-2 md:order-1 relative bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-indigo-500/30 transition-all h-full">
                {/* Badge for "Most Chosen" */}
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-gray-700 text-gray-200 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-600 shadow-sm">
                        الأكثر اختياراً للمستخدمين الجدد
                    </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4 text-gray-400 mt-2">
                    <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{PLANS['ai-single'].name}</h3>
                <div className="text-2xl font-bold text-white mb-4">
                    ${PLANS['ai-single'].price}
                </div>
                <p className="text-gray-400 text-sm mb-6 min-h-[40px]">
                    خيار مرن لمن يحتاج تفسيرات إضافية من وقت لآخر
                </p>
                <div className="space-y-3 mb-8 flex-1">
                    {PLANS['ai-single'].features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check size={16} className="text-indigo-400" />
                            <span>{feat}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => handleSelect('ai-single')}
                    className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-all font-medium"
                >
                    اختيار
                </button>
            </div>

            {/* Monthly Bundle - Highlighted (Mobile Order: 1, Desktop Order: 2) */}
            <div className="order-1 md:order-2 relative bg-indigo-900/20 border-2 border-indigo-500 rounded-2xl p-6 flex flex-col md:scale-105 z-10 shadow-xl shadow-indigo-500/10 h-full">
                <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        ⭐ الأفضل قيمة
                    </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 mt-2">
                    <Star size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{PLANS['ai-monthly'].name}</h3>
                <div className="text-3xl font-bold text-indigo-400 mb-4">
                    ${PLANS['ai-monthly'].price}
                    <span className="text-sm font-normal text-gray-400">/شهر</span>
                </div>
                <p className="text-gray-300 text-sm mb-6 min-h-[40px]">
                    للمهتمين بتفسير أحلامهم بشكل دوري ومنظم
                </p>
                <div className="space-y-3 mb-8 flex-1">
                    {PLANS['ai-monthly'].features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-200">
                            <Check size={16} className="text-indigo-400" />
                            <span>{feat}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => handleSelect('ai-monthly')}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold shadow-lg shadow-indigo-600/20"
                >
                    ابدأ تجربتك الكاملة
                </button>
            </div>

            {/* Human Expert (Mobile Order: 3, Desktop Order: 3) */}
            <div className="order-3 md:order-3 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col hover:border-emerald-500/40 transition-all h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                    <User size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{PLANS['human-single'].name}</h3>
                <div className="text-2xl font-bold text-white mb-4">
                    <span className="text-sm font-normal text-gray-400">يبدأ من</span> ${PLANS['human-single'].priceFrom}
                </div>
                <p className="text-gray-400 text-sm mb-6 min-h-[40px]">
                    استشارة شخصية من مفسر حقيقي يقرأ تفاصيلك
                </p>
                <div className="space-y-3 mb-8 flex-1">
                    {PLANS['human-single'].features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check size={16} className="text-emerald-400" />
                            <span>{feat}</span>
                        </div>
                    ))}
                </div>
                <Link
                    href="/experts"
                    className="w-full py-3 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all font-medium text-center flex items-center justify-center gap-2"
                >
                    تصفح المفسرين
                </Link>
            </div>

        </div>
    );
}
