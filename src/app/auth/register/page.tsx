'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

function RegisterContent() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { registerWithEmail, signInWithGoogle, signInAsGuest } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    const handlePendingDream = async (user: any) => {
        try {
            const pendingDreamStr = localStorage.getItem('pending_dream');
            if (pendingDreamStr) {
                const pendingDream = JSON.parse(pendingDreamStr);
                const token = await user.getIdToken();
                const title = pendingDream.dreamText.split(' ').slice(0, 5).join(' ') + '...';

                await fetch('/api/dreams', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        content: pendingDream.dreamText,
                        interpretation: {
                            summary: pendingDream.interpretation.substring(0, 100) + '...',
                            humanResponse: pendingDream.interpretation,
                            aiGenerated: true
                        },
                        tags: pendingDream.symbols?.map((s: any) => s.name) || [],
                        status: 'completed',
                        date: pendingDream.timestamp || new Date().toISOString(),
                        mood: pendingDream.mood || 'neutral',
                    })
                });

                localStorage.removeItem('pending_dream');
            }
        } catch (e) {
            console.error("Failed to save pending dream:", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('كلمتا المرور غير متطابقتين');
        }

        if (password.length < 6) {
            return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        setIsLoading(true);

        try {
            await registerWithEmail(email.trim(), password, name);
            const { auth } = await import('@/lib/firebase');
            if (auth.currentUser) {
                await handlePendingDream(auth.currentUser);
            }

            // Redirect to requested page or dashboard
            router.push(redirectUrl);
        } catch (err: any) {
            console.error(err);
            setError('فشل إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            const { auth } = await import('@/lib/firebase');
            if (auth.currentUser) {
                await handlePendingDream(auth.currentUser);
            }
            router.push(redirectUrl);
        } catch (err: any) {
            if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
                console.error(err);
                setError('فشل تسجيل الدخول بواسطة جوجل.');
            }
        }
    };

    const handleGuestSignIn = async () => {
        try {
            await signInAsGuest();
            router.push(redirectUrl);
        } catch (err: any) {
            console.error(err);
            setError('فشل الدخول كزائر.');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 pt-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[var(--color-accent)]/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-0 overflow-hidden shadow-[var(--shadow-lg)] border-[var(--color-border)]"
            >
                {/* Header Section with Moon Icon */}
                <div className="relative pt-10 pb-6 text-center">
                    <div className="absolute top-4 right-4 text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors">
                        <Link href="/">✕</Link>
                    </div>

                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] transform rotate-3">
                        <span className="text-4xl filter drop-shadow-md transform -rotate-3">🌙</span>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">أهلاً بك معنا</h1>
                    <p className="text-[var(--color-text-muted)] text-sm">أنشئ حسابك وابدأ رحلة استكشاف رؤاك</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30">
                    <Link href="/auth/login" className="flex-1 py-4 text-center text-[var(--color-text-muted)] hover:text-white hover:bg-white/5 transition-all">
                        تسجيل دخول
                    </Link>
                    <button className="flex-1 py-4 text-center text-white font-bold border-b-2 border-[#a855f7] bg-[#a855f7]/10 relative overflow-hidden">
                        <span className="relative z-10">حساب جديد</span>
                    </button>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-[var(--color-text-muted)] block text-right">الاسم الكامل</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl px-4 py-3 text-right focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="أدخل اسمك"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                dir="rtl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[var(--color-text-muted)] block text-right">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl px-4 py-3 text-right focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[var(--color-text-muted)] block text-right">كلمة المرور</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl px-4 py-3 text-right focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[var(--color-text-muted)] block text-right">تأكيد كلمة المرور</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl px-4 py-3 text-right focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-gradient-to-l from-[#8b5cf6] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#5b21b6] text-white rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.5)] transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        <div className="h-px bg-[var(--color-border)] flex-1"></div>
                        <span>أو التسجيل عبر</span>
                        <div className="h-px bg-[var(--color-border)] flex-1"></div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleGoogleSignIn}
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-xl font-medium transition-colors"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            <span>Google</span>
                        </button>

                        <button
                            onClick={handleGuestSignIn}
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] py-3 rounded-xl font-medium transition-colors"
                        >
                            <span className="text-lg">👤</span>
                            <span>زائر</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <Header />
            <RegisterContent />
        </Suspense>
    );
}
