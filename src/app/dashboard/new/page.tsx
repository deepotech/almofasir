'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InterpreterSelector from '@/components/InterpreterSelector';
import { classicInterpreters } from '@/data/interpreters';

interface InterpretationResult {
    interpretation: string;
    interpreter: string;
}

import InterpretationDisplay from '@/components/InterpretationDisplay';
import RegisterPromptModal from '@/components/modals/RegisterPromptModal';

export default function NewDreamPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [dreamText, setDreamText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<InterpretationResult | null>(null);
    const [selectedInterpreter, setSelectedInterpreter] = useState<string | null>('ibn-sirin');

    // Context State
    const [socialStatus, setSocialStatus] = useState<string>('');
    const [dominantFeeling, setDominantFeeling] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [allowPublishing, setAllowPublishing] = useState<boolean>(false);

    // Upgrade Gate States
    const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(false);
    const [insufficientCredits, setInsufficientCredits] = useState<boolean>(false);
    const [resetTimeInfo, setResetTimeInfo] = useState<{ hours: number; minutes: number } | null>(null);

    const resultRef = useRef<HTMLDivElement>(null);
    const upgradeGateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [result]);

    // Auto-scroll to Upgrade Gate when limit reached
    useEffect(() => {
        if ((dailyLimitReached || insufficientCredits) && upgradeGateRef.current) {
            upgradeGateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [dailyLimitReached, insufficientCredits]);

    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Guest ID Management
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let gid = localStorage.getItem('guest_id');
            if (!gid) {
                gid = 'guest_' + crypto.randomUUID();
                localStorage.setItem('guest_id', gid);
            }
        }
    }, []);

    const isSubmittingRef = useRef(false);

    const handleSubmit = async () => {
        if (!dreamText.trim()) return;
        if (isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsAnalyzing(true);
        setResult(null);
        setDailyLimitReached(false);
        setInsufficientCredits(false);

        try {
            const token = user ? await user.getIdToken() : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Send Persistent Guest ID
                const gid = localStorage.getItem('guest_id');
                if (gid) headers['x-guest-id'] = gid;
            }

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'AI',
                    dreamText: dreamText,
                    interpreter: selectedInterpreter,
                    // allowPublishing not yet supported in /api/orders for consistency, but context is.
                    // If publishing is important, I should add it to API too. For now strict equivalence.
                    context: {
                        socialStatus,
                        dominantFeeling,
                        gender,
                        isRecurring
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown Error' }));

                // Handle specific business logic constraints without throwing
                if (response.status === 403) {
                    const code = errorData.error || errorData.details?.code;

                    if (code === 'GUEST_EXHAUSTED') {
                        setShowRegisterModal(true);
                        return;
                    }
                    if (code === 'DAILY_LIMIT_REACHED') {
                        // Extract reset time from response
                        if (errorData.details?.nextReset) {
                            const nextReset = new Date(errorData.details.nextReset);
                            const now = new Date();
                            const remainingMs = nextReset.getTime() - now.getTime();
                            if (remainingMs > 0) {
                                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                                const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                                setResetTimeInfo({ hours, minutes });
                            }
                        }
                        setDailyLimitReached(true);
                        return;
                    }
                    if (code === 'INSUFFICIENT_CREDITS' || code === 'NO_CREDITS') {
                        setInsufficientCredits(true);
                        return;
                    }
                }

                throw new Error(errorData.error || response.statusText);
            }

            const data = await response.json();

            setResult({
                interpretation: data.interpretation,
                interpreter: selectedInterpreter || 'ibn-sirin'
            });

            // Auto-Publish if requested
            if (allowPublishing && data.orderId) {
                // We don't await this to avoid blocking the UI, but we could show a toast
                // calling the publish API which we fixed to accept Order IDs
                fetch(`/api/dreams/${data.orderId}/publish`, {
                    method: 'POST',
                    headers: headers // Re-use auth headers
                }).then(async (res) => {
                    if (res.ok) {
                        console.log('Auto-published successfully');
                        // Optional: Show success toast
                    } else {
                        console.warn('Auto-publish failed', await res.text());
                    }
                }).catch(err => console.error('Auto-publish error', err));
            }

        } catch (error: any) {
            console.error('Interpretation failed:', error);

            // Fallback for any other errors
            alert(`عذراً، حدث خطأ.\n${error.message || 'يرجى المحاولة مرة أخرى.'}`);
        } finally {
            setIsAnalyzing(false);
            isSubmittingRef.current = false;
        }
    };

    const handleNewDream = () => {
        setDreamText('');
        setResult(null);
    };

    if (authLoading) {
        return <div className="p-2xl text-center">جاري التحميل... 🔮</div>;
    }

    return (
        <div className="dashboard-container animate-fadeIn">
            <header className="mb-2xl">
                <h1 className="text-2xl font-bold mb-sm">🌙 فسّر حلمك الجديد</h1>
                <p className="text-muted">أدخل تفاصيل حلمك واختر المفسر للحصول على تفسير فوري</p>
            </header>

            {/* 🔒 UPGRADE GATE CARD - Shows when limit reached */}
            {(dailyLimitReached || insufficientCredits) && (
                <div ref={upgradeGateRef} className="mb-xl rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-900/20 p-8 text-center backdrop-blur-sm">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-amber-400 mb-3">
                        {dailyLimitReached
                            ? 'لقد استهلكت التفسير المجاني اليومي'
                            : 'رصيدك غير كافٍ'}
                    </h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
                        {dailyLimitReached
                            ? (
                                <>
                                    لقد استخدمت حصتك المجانية لليوم.
                                    {resetTimeInfo && (
                                        <span className="block mt-2 text-amber-400 font-bold">
                                            ⏰ يتجدد خلال: {resetTimeInfo.hours} ساعة و {resetTimeInfo.minutes} دقيقة
                                        </span>
                                    )}
                                    <span className="block mt-2">قم بالترقية واحصل على تفسيرات غير محدودة.</span>
                                </>
                            )
                            : 'قم بشراء رصيد إضافي لمتابعة التفسير بالذكاء الاصطناعي.'}
                    </p>
                    <ul className="text-sm text-gray-400 mb-6 space-y-2 max-w-xs mx-auto text-right">
                        <li>✨ تفسيرات غير محدودة</li>
                        <li>⚡ أولوية في المعالجة</li>
                        <li>📚 حفظ جميع الأحلام</li>
                        <li>🎯 دعم أفضل</li>
                    </ul>
                    <Link
                        href="/pricing"
                        className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-3 font-bold text-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25"
                    >
                        ⭐ الترقية الآن
                    </Link>
                </div>
            )}

            {/* Dream Input Section */}
            <div className="glass-card mb-xl" style={{ padding: 'var(--spacing-xl)' }}>
                <div className="mb-lg">
                    <label className="block text-sm font-medium text-muted mb-sm">
                        ماذا رأيت في حلمك؟
                    </label>
                    <textarea
                        className="textarea textarea-large"
                        placeholder="مثال: رأيت في منامي أنني أسبح في بحر صافٍ تحت ضوء القمر..."
                        value={dreamText}
                        onChange={(e) => setDreamText(e.target.value)}
                        disabled={isAnalyzing}
                        style={{ minHeight: '150px' }}
                    />
                </div>

                {/* Mandatory Context Section */}
                <div className="bg-[var(--color-bg-tertiary)]/30 p-6 rounded-xl border border-[var(--color-border)] mb-lg">
                    <h3 className="text-lg font-bold mb-4 text-[var(--color-secondary)]">📝 معلومات ضرورية لتفسير أدق</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-2 text-gray-300">الجنس</label>
                            <div className="flex gap-3">
                                <button
                                    className={`flex-1 py-2 px-4 rounded-lg border ${gender === 'male' ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-white/5'}`}
                                    onClick={() => setGender('male')}
                                >ذكر</button>
                                <button
                                    className={`flex-1 py-2 px-4 rounded-lg border ${gender === 'female' ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-white/5'}`}
                                    onClick={() => setGender('female')}
                                >أنثى</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-2 text-gray-300">الحالة الاجتماعية</label>
                            <select
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white"
                                value={socialStatus}
                                onChange={(e) => setSocialStatus(e.target.value)}
                            >
                                <option value="">اختر...</option>
                                <option value="single">أعزب / عزباء</option>
                                <option value="married">متزوج / متزوجة</option>
                                <option value="divorced">مطلق / مطلقة</option>
                                <option value="widowed">أرمل / أرملة</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-2 text-gray-300">الشعور أثناء الحلم</label>
                            <select
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white"
                                value={dominantFeeling}
                                onChange={(e) => setDominantFeeling(e.target.value)}
                            >
                                <option value="">اختر...</option>
                                <option value="happy">سعادة / راحة</option>
                                <option value="anxious">قلق / خوف</option>
                                <option value="sad">حزن / ضيق</option>
                                <option value="neutral">عادي / لا أتذكر</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-3 justify-center">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-transparent text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />
                                <label htmlFor="recurring" className="text-sm cursor-pointer select-none">هذا الحلم يتكرر معي</label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="allowPublishing"
                                    checked={allowPublishing}
                                    onChange={(e) => setAllowPublishing(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-transparent text-amber-500 focus:ring-amber-500 accent-amber-500"
                                />
                                <label htmlFor="allowPublishing" className="text-sm cursor-pointer select-none text-amber-400 font-medium">
                                    أوافق على نشر الحلم (مجهول الهوية) لتعميم الفائدة
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interpreter Selection */}
                <InterpreterSelector
                    selectedInterpreter={selectedInterpreter}
                    onSelectInterpreter={setSelectedInterpreter}
                />

                <div className="flex justify-center mt-xl gap-md">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmit}
                        disabled={isAnalyzing || !dreamText.trim()}
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="loading-spinner" style={{ width: 20, height: 20 }}></span>
                                جاري التفسير...
                            </>
                        ) : (
                            <>فسّر حلمي</>
                        )}
                    </button>
                </div>
            </div>

            {/* Result Section */}
            {result && (
                <div ref={resultRef} className="glass-card animate-fadeIn" style={{ padding: 'var(--spacing-xl)' }}>
                    <h3 className="text-center mb-lg text-xl">🔮 التفسير</h3>

                    {/* Interpreter Attribution */}
                    <div className="text-center mb-lg">
                        <span className="tag" style={{
                            background: 'var(--gradient-secondary)',
                            color: 'var(--color-bg-primary)',
                            padding: '0.5rem 1rem',
                            fontSize: 'var(--text-sm)'
                        }}>
                            📖 وفق منهج {classicInterpreters.find(i => i.id === result.interpreter)?.name || 'ابن سيرين'}
                        </span>
                    </div>

                    <div className="mb-xl">
                        <InterpretationDisplay interpretation={result.interpretation} />
                    </div>

                    <div className="flex justify-center gap-md">
                        <button className="btn btn-outline" onClick={handleNewDream}>
                            فسّر حلم آخر
                        </button>
                        <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>
                            العودة للوحة التحكم
                        </button>
                    </div>
                </div>
            )}

            <RegisterPromptModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
            />
        </div>
    );
}
