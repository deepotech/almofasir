'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Zap, User as UserIcon, Shield, CreditCard, Lock, ArrowLeft, Clock, Star } from 'lucide-react';

import { PLANS } from '@/lib/pricing';

const PLAN_DETAILS: Record<string, { name: string; price: string; priceValue: number }> = {
    'ai-single': { name: PLANS['ai-single'].name, price: `$${PLANS['ai-single'].price}`, priceValue: PLANS['ai-single'].price },
    'ai-monthly': { name: PLANS['ai-monthly'].name, price: `$${PLANS['ai-monthly'].price}/شهرياً`, priceValue: PLANS['ai-monthly'].price },
    'human-single': { name: PLANS['human-single'].name, price: `$${PLANS['human-single'].priceFrom}`, priceValue: PLANS['human-single'].priceFrom },
    'booking': { name: 'حجز جلسة تفسير خاصة', price: '$14.99', priceValue: 14.99 }
};

interface HumanDreamData {
    interpreterId: string;
    interpreterName: string;
    price: number;
    responseTime: number;
    dreamContent: string;
    context: {
        gender?: string;
        socialStatus?: string;
        ageRange?: string;
        dominantFeeling?: string;
        isRecurring?: boolean;
    };
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading } = useAuth();

    const type = searchParams.get('type');
    const method = searchParams.get('method') as 'ai' | 'human' | null;
    const planId = searchParams.get('plan');
    const interpreterId = searchParams.get('interpreterId');

    const [isProcessing, setIsProcessing] = useState(false);
    const isSubmitting = useRef(false); // Ref for immediate locking
    const [bookingData, setBookingData] = useState<Record<string, unknown> | null>(null);
    const [humanDreamData, setHumanDreamData] = useState<HumanDreamData | null>(null);

    // Load booking data
    useEffect(() => {
        if (type === 'booking' && !bookingData) {
            const stored = localStorage.getItem('pending_booking');
            if (stored) {
                setBookingData(JSON.parse(stored));
            }
        }
    }, [type, bookingData]);

    // Load human dream data
    useEffect(() => {
        if (type === 'human-dream' && !humanDreamData) {
            const stored = sessionStorage.getItem('humanDreamData');
            if (stored) {
                setHumanDreamData(JSON.parse(stored));
            } else {
                router.replace('/experts');
            }
        }
    }, [type, humanDreamData, router]);

    // Determine plan
    let plan = null;
    if (type === 'human-dream' && humanDreamData) {
        plan = {
            name: `تفسير من: ${humanDreamData.interpreterName}`,
            price: `$${humanDreamData.price}`,
            priceValue: humanDreamData.price
        };
    } else if (type === 'booking') {
        plan = PLAN_DETAILS['booking'];
        if (bookingData?.price) {
            plan = { ...plan, priceValue: bookingData.price as number, price: `$${bookingData.price}` };
        }
    } else if (planId && PLAN_DETAILS[planId]) {
        plan = PLAN_DETAILS[planId];
    }

    // Auth check
    useEffect(() => {
        if (!loading && !user) {
            let redirectUrl = `/checkout?`;
            if (type === 'human-dream') {
                redirectUrl += `type=human-dream&interpreterId=${interpreterId}`;
            } else if (type === 'booking') {
                redirectUrl += `type=booking`;
            } else {
                redirectUrl += `method=${method}&plan=${planId}`;
            }
            router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }
    }, [user, loading, type, method, planId, interpreterId, router]);

    // Validation redirect
    useEffect(() => {
        if (type === 'booking' && !bookingData) {
            const stored = localStorage.getItem('pending_booking');
            if (!stored) {
                router.replace('/booking');
            }
        }
        if (type === 'human-dream' && !humanDreamData) {
            const stored = sessionStorage.getItem('humanDreamData');
            if (!stored) {
                router.replace('/experts');
            }
        }
        if (!plan && !type) {
            router.replace('/pricing');
        }
    }, [plan, type, bookingData, humanDreamData, router]);

    // Loading state
    if (loading || !user || (!plan && !type) || (type === 'booking' && !bookingData) || (type === 'human-dream' && !humanDreamData)) {
        return <div className="min-h-screen flex items-center justify-center text-white">جاري التحويل...</div>;
    }

    const isAI = method === 'ai';
    const isHumanDream = type === 'human-dream';

    const handlePayment = async () => {
        console.log('🚀 [Checkout] handlePayment CALLED');

        // CRITICAL: Multiple layers of duplicate prevention
        // Layer 1: Immediate ref check
        if (isSubmitting.current) {
            console.warn('[Checkout] Already processing, ignoring duplicate click');
            return;
        }

        // Layer 2: State check
        if (isProcessing) {
            console.warn('[Checkout] Already in processing state');
            return;
        }

        // Layer 3: Lock IMMEDIATELY before any async operations
        isSubmitting.current = true;
        setIsProcessing(true);

        // Layer 4: localStorage lock (survives refreshes during processing)
        const lockKey = 'payment_in_progress';
        if (localStorage.getItem(lockKey)) {
            console.error('[Checkout] Payment already in progress from another session');
            alert('عملية دفع جارية بالفعل. يرجى الانتظار.');
            isSubmitting.current = false;
            setIsProcessing(false);
            return;
        }
        localStorage.setItem(lockKey, Date.now().toString());

        try {
            // Removed simulated delay to reduce race condition window
            // await new Promise(resolve => setTimeout(resolve, 2000));

            let res;

            if (isHumanDream && humanDreamData && user) {
                // UNIFIED FLOW: Create order via /api/orders, then select interpreter
                const token = await user.getIdToken();

                // Step 1: Create or get existing order
                const orderRes = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'HUMAN',
                        dreamText: humanDreamData.dreamContent,
                        context: humanDreamData.context,
                        interpreterId: humanDreamData.interpreterId,
                        interpreterName: humanDreamData.interpreterName
                    })
                });

                if (!orderRes.ok) {
                    const errorData = await orderRes.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to create order');
                }

                const orderData = await orderRes.json();
                const orderId = orderData.orderId;

                console.log(`[Checkout] Order created/retrieved: ${orderId}`);

                // Step 2: If not already assigned, select interpreter
                if (!orderData.order?.interpreterId || orderData.upsert) {
                    const selectRes = await fetch(`/api/orders/${orderId}/select-interpreter`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            interpreterId: humanDreamData.interpreterId
                        })
                    });

                    if (!selectRes.ok) {
                        console.warn('Failed to select interpreter, order still created');
                    }
                }

                // Step 3: Mock payment success - update payment status
                await fetch(`/api/payment/mock-success`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        orderId: orderId,
                        type: 'human-dream'
                    })
                });

                sessionStorage.removeItem('humanDreamData');
                localStorage.removeItem(lockKey); // Clear lock before navigation
                router.push(`/dashboard/requests/${orderId}`);
                return;

            } else if (type === 'booking') {
                res = await fetch('/api/booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...bookingData,
                        userId: user?.uid,
                        interpreter: bookingData?.interpreter // Ensure ID is passed
                    })
                });
            } else {
                res = await fetch('/api/payment/mock-success', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId,
                        userId: user?.uid
                    })
                });
            }

            if (res && !res.ok) {
                const errorBody = await res.json().catch(() => ({ error: res.statusText }));
                console.error('[Checkout] Payment API failed:', errorBody);
                throw new Error(errorBody.error || `Payment failed: ${res.status}`);
            }

            const successUrl = type === 'booking'
                ? '/checkout/success?type=booking'
                : `/checkout/success?method=${method}&plan=${planId}`;

            localStorage.removeItem(lockKey); // Clear lock before navigation
            router.push(successUrl);

        } catch (error) {
            console.error('Payment error:', error);
            localStorage.removeItem(lockKey); // Clear lock on error
            setIsProcessing(false);
            isSubmitting.current = false; // Unlock on error
            alert('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleBack = () => {
        if (isProcessing) return; // Prevent nav while processing
        if (isHumanDream) {
            router.push(`/interpret/${interpreterId}`);
        } else if (type === 'booking') {
            router.push('/booking');
        } else {
            router.push(`/pricing/confirm?method=${method}&plan=${planId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
            <Header />

            <main className="container mx-auto px-4 pb-12" style={{ paddingTop: 120 }}>

                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-10">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isHumanDream ? 'bg-amber-500/20 text-amber-400' : isAI ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        <CreditCard size={32} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        إتمام الدفع
                    </h1>
                    <p className="text-gray-400">
                        {isHumanDream ? 'خطوة أخيرة لإرسال حلمك للمفسر' : 'خطوة واحدة فقط لبدء تفسير أحلامك'}
                    </p>
                </div>

                {/* Payment Card */}
                <div className="max-w-md mx-auto">

                    {/* Order Summary */}
                    <div className="bg-[rgba(255,255,255,0.02)] border border-gray-800 rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-4">ملخص الطلب</h3>

                        <div className="flex items-center gap-4 pb-4 border-b border-gray-800 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isHumanDream ? 'bg-amber-500/20 text-amber-400' : isAI ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {isHumanDream ? <UserIcon size={24} /> : isAI ? <Zap size={24} /> : <UserIcon size={24} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-white">{plan?.name}</p>
                                {isHumanDream && humanDreamData && (
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            خلال {humanDreamData.responseTime} ساعة
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dream Preview for Human Dream */}
                        {isHumanDream && humanDreamData && (
                            <div className="mb-4 p-3 bg-white/5 rounded-xl">
                                <p className="text-xs text-gray-400 mb-1">نص الحلم:</p>
                                <p className="text-sm text-gray-300 line-clamp-3">{humanDreamData.dreamContent}</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">الإجمالي</span>
                            <span className={`text-2xl font-bold ${isHumanDream ? 'text-amber-400' : isAI ? 'text-indigo-400' : 'text-emerald-400'}`}>{plan?.price}</span>
                        </div>
                    </div>

                    {/* Refund Policy for Human Dream */}
                    {isHumanDream && (
                        <div className="bg-[rgba(255,255,255,0.02)] border border-gray-800 rounded-2xl p-6 mb-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-4">سياسة الاسترجاع</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <Shield size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                    <span>استرجاع كامل إذا لم يتم التفسير خلال المدة المحددة</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Shield size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                    <span>يمكنك طلب مراجعة إذا لم تكن راضياً</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* What Happens Next */}
                    <div className="bg-[rgba(255,255,255,0.02)] border border-gray-800 rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-4">ماذا بعد الدفع؟</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {isHumanDream
                                ? `سيصل حلمك للمفسر مباشرة، وسيراجعه ويرسل لك التفسير خلال ${humanDreamData?.responseTime || 24} ساعة. ستصلك إشعار عند جاهزية التفسير.`
                                : isAI
                                    ? 'ستنتقل مباشرة لكتابة حلمك، وستحصل على تفسيرك الفوري في ثوانٍ معدودة.'
                                    : 'ستنتقل لكتابة حلمك مع تفاصيل حالتك، وسيراجعه المفسر ويرسل لك التفسير خلال 24-48 ساعة.'
                            }
                        </p>
                    </div>

                    {/* Security Message */}
                    <div className="flex items-center gap-3 p-4 bg-[rgba(16,185,129,0.05)] border border-emerald-500/20 rounded-xl mb-8">
                        <Shield size={20} className="text-emerald-400 shrink-0" />
                        <p className="text-sm text-emerald-300/80">
                            معلوماتك آمنة ولن تُشارك مع أي طرف.
                        </p>
                    </div>

                    {/* Payment Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                                ${isProcessing
                                    ? 'bg-gray-700 cursor-not-allowed opacity-70'
                                    : 'bg-[#0070ba] hover:bg-[#005ea6] text-white'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.65h6.608c2.285 0 4.163.636 5.085 2.145.43.703.604 1.464.6 2.355-.006 1.015-.274 1.934-.598 2.719-.614 1.493-1.673 2.614-3.003 3.275-1.225.608-2.647.883-4.23.883H8.196a.833.833 0 0 0-.82.699l-.3 1.9-1 6.33v-.039z" />
                                        <path d="M18.393 7.09c-.083 3.532-2.468 5.748-5.968 5.748H10.7a.681.681 0 0 0-.672.574l-.918 5.83a.573.573 0 0 0 .566.66h3.173a.613.613 0 0 0 .606-.52l.025-.127.48-3.045.031-.166a.613.613 0 0 1 .606-.52h.38c2.47 0 4.403-1.003 4.968-3.903.236-1.212.114-2.223-.511-2.934a2.447 2.447 0 0 0-.7-.535c.143.615.209 1.25.197 1.886v.052h.462z" />
                                    </svg>
                                    <span>الدفع عبر PayPal</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleBack}
                            disabled={isProcessing}
                            className="w-full py-3 rounded-xl font-medium text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            <span>العودة</span>
                        </button>
                    </div>

                    {/* Secure Badge */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500">
                        <Lock size={14} />
                        <span>دفع آمن ومشفر</span>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
