'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { signInWithGoogle, signInAsGuest, loginWithEmail, registerWithEmail } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
            } else {
                if (name.length < 2) throw new Error('يرجى إدخال اسم صحيح');
                await registerWithEmail(email, password, name);
            }
            onClose();
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('البريد الإلكتروني مستخدم بالفعل');
            } else if (err.code === 'auth/weak-password') {
                setError('كلمة المرور ضعيفة جداً');
            } else {
                setError(err.message || 'حدث خطأ غير متوقع');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            onClose();
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء تسجيل الدخول باستخدام Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInAsGuest();
            onClose();
            router.push('/dashboard');
        } catch (err: any) {
            if (err.code === 'auth/admin-restricted-operation') {
                setError('تسجيل الزوار غير مفعل حالياً');
            } else {
                setError('حدث خطأ أثناء الدخول كزائر');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#0f0f2a] border border-[#ffffff1a] rounded-2xl shadow-2xl shadow-purple-900/20 overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                {/* Header */}
                <div className="relative p-6 text-center border-b border-white/5">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
                        🌙
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                        {mode === 'login' ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">
                        {mode === 'login' ? 'سجل دخولك لمتابعة تفسير أحلامك' : 'انضم إلينا وابدأ رحلة اكتشاف ذاتك'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-white/5 mx-6 mt-6 rounded-lg">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        تسجيل دخول
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        حساب جديد
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 text-sm text-red-200 bg-red-900/40 border border-red-500/20 rounded-lg text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">الاسم</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="اسمك الكريم"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="name@example.com"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">كلمة المرور</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                dir="ltr"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'جاري المعالجة...' : (mode === 'login' ? 'دخول' : 'إنشاء حساب')}
                        </button>
                    </form>

                    <div className="relative flex items-center py-6">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">أو المتابعة عبر</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 p-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm">Google</span>
                        </button>

                        <button
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 p-3 bg-white/5 text-white border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            <span className="text-lg">👤</span>
                            <span className="text-sm">زائر</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
