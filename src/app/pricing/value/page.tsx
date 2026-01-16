'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Suspense } from 'react';
import { Zap, User as UserIcon, Clock, BookOpen, Shield, MessageCircle, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

function ValueContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const method = searchParams.get('method') as 'ai' | 'human' | null;

    // Redirect if no method selected
    if (!method) {
        if (typeof window !== 'undefined') {
            router.push('/pricing');
        }
        return null;
    }

    const handleContinue = () => {
        router.push(`/pricing/plan?method=${method}`);
    };

    const handleBack = () => {
        router.push('/pricing');
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
                        <span className={isAI ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>٢. الشرح</span>
                        <span>٣. الخيارات</span>
                        <span>٤. التأكيد</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full w-2/4 rounded-full ${isAI ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}></div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isAI ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isAI ? <Zap size={40} /> : <UserIcon size={40} />}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        {isAI ? 'تفسير فوري وشامل' : 'تفسير إنساني متخصص'}
                    </h1>
                    <p className="text-lg text-gray-400">
                        {isAI ? 'إليك تفاصيل ما ستحصل عليه' : 'تعرف على طبيعة هذا التفسير'}
                    </p>
                </div>

                {/* Value Cards */}
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

                    {isAI ? (
                        <>
                            {/* AI Content */}
                            <div className="bg-[rgba(99,102,241,0.05)] border border-indigo-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <MessageCircle size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">هذا التفسير مناسب إذا:</h3>
                                </div>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li>• تريد فهمًا سريعًا للحلم</li>
                                    <li>• تبحث عن دلالة عامة ومعاني محتملة</li>
                                    <li>• تفضل الخصوصية والرد الفوري</li>
                                </ul>
                            </div>

                            <div className="bg-[rgba(99,102,241,0.05)] border border-indigo-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <BookOpen size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">يتم التحليل بناءً على:</h3>
                                </div>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li>• نص الحلم الذي تكتبه</li>
                                    <li>• حالتك النفسية (إن ذكرتها)</li>
                                    <li>• أشهر دلالات الرموز في كتب التفسير</li>
                                </ul>
                            </div>

                            <div className="bg-[rgba(99,102,241,0.05)] border border-indigo-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Clock size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">متى تحصل على النتيجة؟</h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    <span className="text-indigo-400 font-bold">فوراً.</span> في نفس اللحظة التي ترسل فيها الحلم.
                                </p>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-4">
                                <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-white mb-1">تنبيه هام</h3>
                                    <p className="text-sm text-yellow-200/80">هذا التفسير إرشادي ورمزي وليس فتوى شرعية.</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Human Content */}
                            <div className="bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <MessageCircle size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">هذا الخيار مناسب إذا:</h3>
                                </div>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li>• كان الحلم مقلقًا أو متكررًا</li>
                                    <li>• شعرت أن التفسير الآلي غير كافٍ</li>
                                    <li>• تفضّل رأيًا بشريًا بخبرة واقعية</li>
                                </ul>
                            </div>

                            <div className="bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <UserIcon size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">دور المفسر:</h3>
                                </div>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li>• يقرأ حلمك يدويًا بعناية</li>
                                    <li>• يراعي سياقك الشخصي وظروفك</li>
                                    <li>• يربط الرموز ببعضها لتكوين صورة كاملة</li>
                                </ul>
                            </div>

                            <div className="bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Clock size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">مدة الرد المتوقعة؟</h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    يلتزم المفسر بالرد خلال مدة محددة بوضوح (عادة 24-48 ساعة).
                                </p>
                            </div>

                            <div className="bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">الخصوصية:</h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    حلمك يظهر للمفسر فقط، ولا يتم نشره أو مشاركته مع أي طرف ثالث.
                                </p>
                            </div>
                        </>
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
                        className={`
                            group px-10 py-3 rounded-full font-bold transition-all flex items-center gap-3 text-white shadow-lg
                            ${isAI
                                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                            }
                        `}
                    >
                        <span>فهمت، أرني الخيارات</span>
                        <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={18} />
                    </button>
                </div>

            </main>
            <Footer />
        </div>
    );
}

export default function ValuePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <ValueContent />
        </Suspense>
    );
}
