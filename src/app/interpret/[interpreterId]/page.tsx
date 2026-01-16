'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Star, Clock, Shield, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Interpreter {
    id: string;
    displayName: string;
    avatar?: string;
    bio: string;
    interpretationType: string;
    interpretationTypeAr: string;
    price: number;
    responseTime: number;
    responseTimeText: string;
    rating: number;
    totalRatings: number;
    completedDreams: number;
}

interface PageProps {
    params: Promise<{ interpreterId: string }>;
}

export default function InterpretPage({ params }: PageProps) {
    const { interpreterId } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [interpreter, setInterpreter] = useState<Interpreter | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [dreamContent, setDreamContent] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [socialStatus, setSocialStatus] = useState<'single' | 'married' | 'divorced' | 'widowed' | ''>('');
    const [ageRange, setAgeRange] = useState<'child' | 'teen' | 'adult' | 'elderly' | ''>('');
    const [dominantFeeling, setDominantFeeling] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);

    useEffect(() => {
        fetchInterpreter();
    }, [interpreterId]);

    const fetchInterpreter = async () => {
        try {
            const res = await fetch(`/api/interpreters/${interpreterId}`);
            if (res.ok) {
                const data = await res.json();
                setInterpreter(data.interpreter);
            } else {
                router.push('/experts');
            }
        } catch (error) {
            console.error('Error fetching interpreter:', error);
            router.push('/experts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!dreamContent.trim()) {
            alert('يرجى كتابة حلمك');
            return;
        }

        if (!user) {
            // Store dream in session and redirect to login
            sessionStorage.setItem('pendingHumanDream', JSON.stringify({
                interpreterId,
                dreamContent,
                context: { gender, socialStatus, ageRange, dominantFeeling, isRecurring }
            }));
            router.push('/auth/login?redirect=/interpret/' + interpreterId);
            return;
        }

        setSubmitting(true);

        // Store dream data and go to checkout
        sessionStorage.setItem('humanDreamData', JSON.stringify({
            interpreterId,
            interpreterName: interpreter?.displayName,
            price: interpreter?.price,
            responseTime: interpreter?.responseTime,
            dreamContent,
            context: { gender, socialStatus, ageRange, dominantFeeling, isRecurring }
        }));

        router.push(`/checkout?type=human-dream&interpreterId=${interpreterId}`);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                    />
                ))}
            </div>
        );
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (!interpreter) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-white">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12" style={{ marginTop: 100 }}>
                {/* Back Link */}
                <Link href="/experts" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ChevronLeft size={20} />
                    العودة لقائمة المفسرين
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Dream Input */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <h1 className="text-2xl font-bold mb-2">أدخل حلمك</h1>
                            <p className="text-gray-400 mb-6">
                                اكتب حلمك بأكبر قدر من التفاصيل للحصول على تفسير دقيق
                            </p>

                            {/* Dream Content */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2">وصف الحلم *</label>
                                <textarea
                                    value={dreamContent}
                                    onChange={(e) => setDreamContent(e.target.value)}
                                    placeholder="اكتب حلمك هنا بالتفصيل... كلما كان الوصف أدق، كان التفسير أفضل"
                                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-[var(--color-primary)] focus:outline-none resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {dreamContent.length} حرف
                                </p>
                            </div>

                            {/* Context Fields */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-[var(--color-primary)]" />
                                    معلومات إضافية (تساعد في التفسير)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">الجنس</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value as typeof gender)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[var(--color-primary)] focus:outline-none"
                                        >
                                            <option value="" className="bg-gray-900">اختر...</option>
                                            <option value="male" className="bg-gray-900">ذكر</option>
                                            <option value="female" className="bg-gray-900">أنثى</option>
                                        </select>
                                    </div>

                                    {/* Social Status */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">الحالة الاجتماعية</label>
                                        <select
                                            value={socialStatus}
                                            onChange={(e) => setSocialStatus(e.target.value as typeof socialStatus)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[var(--color-primary)] focus:outline-none"
                                        >
                                            <option value="" className="bg-gray-900">اختر...</option>
                                            <option value="single" className="bg-gray-900">أعزب/عزباء</option>
                                            <option value="married" className="bg-gray-900">متزوج/ة</option>
                                            <option value="divorced" className="bg-gray-900">مطلق/ة</option>
                                            <option value="widowed" className="bg-gray-900">أرمل/ة</option>
                                        </select>
                                    </div>

                                    {/* Age Range */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">الفئة العمرية</label>
                                        <select
                                            value={ageRange}
                                            onChange={(e) => setAgeRange(e.target.value as typeof ageRange)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[var(--color-primary)] focus:outline-none"
                                        >
                                            <option value="" className="bg-gray-900">اختر...</option>
                                            <option value="child" className="bg-gray-900">طفل (أقل من 12)</option>
                                            <option value="teen" className="bg-gray-900">مراهق (12-18)</option>
                                            <option value="adult" className="bg-gray-900">بالغ (18-60)</option>
                                            <option value="elderly" className="bg-gray-900">كبير (60+)</option>
                                        </select>
                                    </div>

                                    {/* Dominant Feeling */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">الشعور السائد</label>
                                        <input
                                            type="text"
                                            value={dominantFeeling}
                                            onChange={(e) => setDominantFeeling(e.target.value)}
                                            placeholder="مثال: خوف، فرح، حيرة..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[var(--color-primary)] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Recurring */}
                                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-5 h-5 rounded bg-white/5 border border-white/20 checked:bg-[var(--color-primary)]"
                                    />
                                    <span className="text-sm text-gray-300">هذا حلم متكرر</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Order Summary (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-bold mb-4">ملخص الطلب</h2>

                            {/* Interpreter Info */}
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-amber-600 flex items-center justify-center text-lg font-bold">
                                    {interpreter.avatar || interpreter.displayName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold">{interpreter.displayName}</p>
                                    <p className="text-sm text-gray-400">{interpreter.interpretationTypeAr}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">التقييم</span>
                                    <div className="flex items-center gap-2">
                                        {renderStars(interpreter.rating)}
                                        <span className="text-gray-500">({interpreter.totalRatings})</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <Clock size={14} /> مدة الرد
                                    </span>
                                    <span>{interpreter.responseTimeText}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">تفسيرات سابقة</span>
                                    <span>{interpreter.completedDreams}</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between py-4 border-t border-b border-white/10 mb-6">
                                <span className="text-lg font-bold">السعر</span>
                                <span className="text-2xl font-bold text-[var(--color-primary)]">${interpreter.price}</span>
                            </div>

                            {/* Guarantees */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Shield size={16} className="text-emerald-400" />
                                    <span>استرجاع كامل إذا لم يُفسَّر</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Shield size={16} className="text-emerald-400" />
                                    <span>تفسير خلال المدة المحددة</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleSubmit}
                                disabled={!dreamContent.trim() || submitting}
                                className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-amber-500 text-black font-bold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {submitting ? 'جاري المعالجة...' : 'الانتقال إلى الدفع'}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-3">
                                بالضغط على الزر، أنت توافق على شروط الخدمة
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
