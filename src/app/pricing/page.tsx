'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PricingCards from '@/components/pricing/PricingCards';
import { Shield, Lock, CreditCard } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden">
            <Header />

            <main className="flex flex-col justify-center min-h-screen pt-40 pb-20 items-center">
                {/* Header Section */}
                <div className="relative z-20 text-center px-4 mb-48 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                        اختر ما يناسبك الآن
                    </h1>
                    <p className="text-xl text-gray-400 mb-4">
                        ويمكنك الترقية أو التوقف في أي وقت
                    </p>
                    <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1">
                        <p className="text-sm text-indigo-300">
                            🎁 لديك تفسير مجاني يوميًا — تحتاج الدفع فقط إذا أردت المزيد الآن
                        </p>
                    </div>
                </div>

                {/* Pricing Cards */}
                <PricingCards />

                {/* Trust & Guarantee Section */}
                <div className="max-w-4xl mx-auto mt-24 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                                <Shield size={24} />
                            </div>
                            <h3 className="font-bold text-white">خصوصية تامة</h3>
                            <p className="text-sm text-gray-400">أحلامك مشفرة ولا يمكن لأحد الاطلاع عليها بدون إذنك</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Lock size={24} />
                            </div>
                            <h3 className="font-bold text-white">دفع آمن</h3>
                            <p className="text-sm text-gray-400">جميع المعاملات محمية بأحدث تقنيات التشفير العالمية</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="font-bold text-white">دون التزام</h3>
                            <p className="text-sm text-gray-400">يمكنك إلغاء الاشتراك الشهري في أي وقت بضغطة زر</p>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="max-w-3xl mx-auto mt-20 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                    <p className="text-amber-500/80 text-sm leading-relaxed">
                        تنبيه مهم: التفسير بالذكاء الاصطناعي أداة مساعدة للاستئناس تعتمد على المصادر الإسلامية.
                        التفسيرات ليست فتوى شرعية ولا حكماً قاطعاً. الأحلام رسائل روحية قد تحمل معانٍ متعددة.
                    </p>
                </div>

            </main>
            <Footer />
        </div>
    );
}
