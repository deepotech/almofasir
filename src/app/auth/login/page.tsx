'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithEmail, signInWithGoogle, signInAsGuest } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await loginWithEmail(email.trim(), password);

            // If redirect URL exists, prioritize it
            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }

            // Otherwise check Role for dashboard
            const res = await fetch('/api/users/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.role === 'interpreter') {
                    router.push('/interpreter/dashboard');
                } else if (data.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError('فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            router.push(redirectUrl || '/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('فشل تسجيل الدخول بواسطة جوجل.');
        }
    };

    const handleGuestSignIn = async () => {
        try {
            await signInAsGuest();
            router.push(redirectUrl || '/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('فشل الدخول كزائر.');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]">
            {/* Cosmic Background Effects */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                {/* Stars / Particles */}
                <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-75 shadow-[0_0_15px_pink]"></div>
                <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-yellow-100 rounded-full animate-pulse delay-150"></div>

                {/* Nebulas */}
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[10s]"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] mix-blend-screen"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md"
            >
                {/* Glassmorphism Card */}
                <div className="glass-card p-0 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/10 backdrop-blur-xl bg-white/5 rounded-3xl">

                    {/* Glow Effect behind card */}
                    <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-purple-500/20 blur-3xl rounded-full opacity-50"></div>

                    {/* Top Decorative Header */}
                    <div className="relative pt-10 pb-2 text-center">
                        <Link
                            href="/"
                            className="absolute top-4 right-6 text-white/50 hover:text-white transition-colors text-xl font-light"
                        >
                            ✕
                        </Link>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] rotate-3 border border-white/10"
                        >
                            <span className="text-4xl filter drop-shadow-lg -rotate-3">🌙</span>
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">مرحباً بعودتك</h1>
                        <p className="text-blue-200/70 text-sm font-medium">بوابة عالم الأحلام</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 mt-6 mx-8">
                        <div className="flex-1 py-3 text-center text-white font-bold border-b-2 border-violet-500 relative cursor-default">
                            <span className="relative z-10 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">تسجيل دخول</span>
                        </div>
                        <Link href="/auth/register" className="flex-1 py-3 text-center text-white/40 hover:text-white transition-all font-medium">
                            حساب جديد
                        </Link>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2"
                            >
                                <span>⚠️</span>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2 group">
                                <label className="text-xs text-blue-200/80 font-medium block text-right pr-1">البريد الإلكتروني</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-right text-white focus:border-violet-500 focus:bg-black/30 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all placeholder:text-white/20 pl-10 dir-ltr"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        dir="ltr"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg group-focus-within:text-violet-400 transition-colors">✉️</span>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <div className="flex justify-between items-end pr-1">
                                    <label className="text-xs text-blue-200/80 font-medium block">كلمة المرور</label>
                                    <Link href="/auth/forgot-password" className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">نسيت كلمة المرور؟</Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-right text-white focus:border-violet-500 focus:bg-black/30 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all placeholder:text-white/20 pl-10 dir-ltr"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        dir="ltr"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg group-focus-within:text-violet-400 transition-colors">🔒</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)] border border-white/10 backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4 transition-all"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        جاري الدخول...
                                    </span>
                                ) : 'دخول لعالم الأحلام'}
                            </motion.button>
                        </form>

                        <div className="mt-8 mb-6 flex items-center gap-4 text-xs text-blue-200/40">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span>أو المتابعة عبر</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                onClick={handleGoogleSignIn}
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 py-3 rounded-xl font-medium transition-all text-white/90"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Google</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                onClick={handleGuestSignIn}
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 py-3 rounded-xl font-medium transition-all text-white/90"
                            >
                                <span className="text-lg">👤</span>
                                <span>زائر</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Footer decoration */}
                <div className="text-center mt-6 text-blue-200/40 text-xs">
                    <p>© {new Date().getFullYear()} المفسر. جميع الحقوق محفوظة</p>
                </div>
            </motion.div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <Header />
            <LoginContent />
            {/* Note: Header is outside in main but LoginContent renders main. Header should be outside usually. Fixed layout above. */}
        </Suspense>
    );
}
