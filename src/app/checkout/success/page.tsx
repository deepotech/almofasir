'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Check, Zap, User as UserIcon, PenLine, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti'; // Assuming canvas-confetti is installed and used

const PLAN_DETAILS: Record<string, { name: string; features: string[] }> = {
    'ai-single': {
        name: 'تفسير واحد بالذكاء الاصطناعي',
        features: ['تفسيرك جاهز الآن', 'متاح في سجل أحلامك']
    },
    'ai-monthly': {
        name: 'باقة شهرية - ذكاء اصطناعي',
        features: ['تم تفعيل اشتراكك', '10 رصيد أحلام مضاف', 'صلاحية لمدة 30 يوم']
    },
    'human-single': {
        name: 'استشارة مفسر حقيقي',
        features: ['تم استلام طلبك', 'سيتم مراجعة الحلم', 'الرد خلال 24-48 ساعة']
    },
    'booking': {
        name: 'حجز جلسة تفسير خاصة',
        features: ['تم تأكيد حجزك', 'تم إرسال التفاصيل للإيميل', 'سيتم التواصل معك قريباً']
    },
    'human-dream': {
        name: 'تفسير من مفسر حقيقي',
        features: ['تم إرسال حلمك للمفسر', 'ستصلك إشعار عند جهوز التفسير', 'يمكنك متابعة الطلب من لوحة التحكم']
    }
};

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, refreshProfile } = useAuth(); // We might need this, or not. Booking data has everything.

    const method = searchParams.get('method');
    const planId = searchParams.get('plan');
    const type = searchParams.get('type'); // 'booking'

    const [isBookingProcessed, setIsBookingProcessed] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    useEffect(() => {
        // Special handling for Booking Type
        if (type === 'booking' && !isBookingProcessed) {
            const processBooking = async () => {
                const storedBooking = localStorage.getItem('pending_booking');
                if (!storedBooking) {
                    // If no stored booking, it might have been processed already or is an invalid state.
                    // We can choose to redirect or show an error. For now, just return.
                    console.warn('No pending booking found in localStorage for type=booking success page.');
                    return;
                }

                try {
                    const bookingData = JSON.parse(storedBooking);

                    // Call Booking API
                    const res = await fetch('/api/booking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bookingData)
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Failed to submit booking');
                    }

                    // Clear pending booking
                    localStorage.removeItem('pending_booking');
                    setIsBookingProcessed(true);

                } catch (error: any) {
                    console.error('Booking submission failed:', error);
                    setBookingError(error.message);
                }
            };

            processBooking();
        }
    }, [type, isBookingProcessed]);

    // Refresh profile on mount to ensure credits/plan are updated in context for non-booking flows
    useEffect(() => {
        if (type !== 'booking') {
            refreshProfile();
        }
    }, [refreshProfile, type]);

    // Validation
    // For normal flow: need method & planId
    // For booking flow: need type='booking'
    // For human-dream flow: need type='human-dream'
    const isValidNormal = method && planId && PLAN_DETAILS[planId];
    const isValidBooking = type === 'booking';
    const isValidHumanDream = type === 'human-dream';

    useEffect(() => {
        if (!isValidNormal && !isValidBooking && !isValidHumanDream) {
            router.push('/');
        }
    }, [isValidNormal, isValidBooking, isValidHumanDream, router]);

    if (!isValidNormal && !isValidBooking && !isValidHumanDream) {
        return null;
    }

    const plan = isValidBooking ? PLAN_DETAILS['booking'] : PLAN_DETAILS[planId!];
    const isAI = method === 'ai';

    // Confetti Effect
    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    if (bookingError) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
                <Header />
                <main className="container mx-auto px-4 pb-12 flex flex-col items-center justify-center text-center" style={{ paddingTop: 120, minHeight: '80vh' }}>
                    <div className="max-w-xl mx-auto glass-card p-12 relative overflow-hidden">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-red-400">
                            حدث خطأ! 😔
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            {bookingError}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-primary px-8 py-3 rounded-full text-lg shadow-lg shadow-red-500/20"
                        >
                            العودة للرئيسية
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
            <Header />

            <main className="container mx-auto px-4 pb-12 flex flex-col items-center justify-center" style={{ paddingTop: 120, minHeight: '80vh' }}>

                {/* Success Icon */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 animate-fadeIn ${isAI ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
                    <Check size={56} className={isAI ? 'text-indigo-400' : 'text-emerald-400'} />
                </div>

                {/* Success Message */}
                <div className="text-center max-w-lg mx-auto mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        {isValidBooking ? 'تم الحجز والدفع بنجاح! 🎉' : 'تم بنجاح! 🎉'}
                    </h1>
                    <p className="text-lg text-gray-400">
                        {isValidBooking
                            ? 'شكراً لك، تم تأكيد حجزك وإرسال التفاصيل إلى بريدك الإلكتروني.'
                            : 'شكراً لثقتك بنا. أصبحت جاهزاً لتفسير أحلامك.'
                        }
                    </p>
                </div>

                {/* Next Steps Card */}
                {!isValidBooking && (
                    <div className={`max-w-md w-full rounded-2xl p-8 mb-8 border-2 ${isAI ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-emerald-600/5 border-emerald-500/30'}`}>
                        <h3 className="text-lg font-bold mb-6 text-center">الخطوة التالية</h3>

                        {isAI ? (
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                    <PenLine size={32} className="text-indigo-400" />
                                </div>
                                <h4 className="font-bold mb-2 text-white">اكتب حلمك الآن</h4>
                                <p className="text-sm text-gray-400 mb-6">
                                    اذهب للصفحة الرئيسية واكتب تفاصيل حلمك. ستحصل على تفسيرك الفوري في ثوانٍ!
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25 group"
                                >
                                    <span>اكتب حلمك</span>
                                    <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={18} />
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <Clock size={32} className="text-emerald-400" />
                                </div>
                                <h4 className="font-bold mb-2 text-white">اكتب حلمك وانتظر الرد</h4>
                                <p className="text-sm text-gray-400 mb-6">
                                    اذهب للصفحة الرئيسية واكتب تفاصيل حلمك بعناية. سيقرأه المفسر ويرسل لك تفسيراً شخصياً خلال 24-48 ساعة.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/25 group"
                                >
                                    <span>اكتب حلمك</span>
                                    <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={18} />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Specific Next Steps */}
                {isValidBooking && (
                    <div className="max-w-md w-full rounded-2xl p-8 mb-8 border-2 bg-emerald-600/5 border-emerald-500/30">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                <Clock size={32} className="text-emerald-400" />
                            </div>
                            <h4 className="font-bold mb-2 text-white">ماذا تتوقع الآن؟</h4>
                            <p className="text-sm text-gray-400 mb-6">
                                سنتواصل معك قريباً عبر الواتساب لتأكيد الموعد وترتيب التفاصيل النهائية.
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/25 group"
                            >
                                <span>العودة للرئيسية</span>
                                <ArrowRight className="group-hover:-translate-x-1 transition-transform" size={18} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Status Tracking */}
                {!isValidBooking && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">يمكنك تتبع أحلامك والتفسيرات من لوحة التحكم</p>
                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-400 hover:text-white transition-colors underline"
                        >
                            الذهاب للوحة التحكم ←
                        </Link>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
