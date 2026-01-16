'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { motion } from 'framer-motion';

function ForgotPasswordContent() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await resetPassword(email.trim());
            setStatus('success');
            setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            if (err.code === 'auth/user-not-found') {
                setMessage('لا يوجد حساب بهذا البريد الإلكتروني.');
            } else {
                setMessage('حدث خطأ أثناء إرسال البريد. يرجى المحاولة مرة أخرى.');
            }
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]">
            {/* Cosmic Background Effects */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-75 shadow-[0_0_15px_pink]"></div>
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px] mix-blend-screen"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md"
            >
                <div className="glass-card p-0 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/10 backdrop-blur-xl bg-white/5 rounded-3xl">

                    {/* Header */}
                    <div className="relative pt-10 pb-2 text-center">
                        <Link
                            href="/auth/login"
                            className="absolute top-4 right-6 text-white/50 hover:text-white transition-colors flex items-center gap-1 text-sm group"
                        >
                            <span>عودة للوراء</span>
                            <span className="group-hover:-translate-x-1 transition-transform">→</span>
                        </Link>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] rotate-3 border border-white/10"
                        >
                            <span className="text-4xl filter drop-shadow-lg -rotate-3">🔑</span>
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">استعادة الحساب</h1>
                        <p className="text-blue-200/70 text-sm font-medium px-4">أدخل بريدك الإلكتروني لاستعادة كلمة المرور</p>
                    </div>

                    <div className="p-8">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`px-4 py-3 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2 border ${status === 'success'
                                        ? 'bg-green-500/10 border-green-500/30 text-green-200'
                                        : 'bg-red-500/10 border-red-500/30 text-red-200'
                                    }`}
                            >
                                <span>{status === 'success' ? '✅' : '⚠️'}</span>
                                {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)] border border-white/10 backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        جاري الإرسال...
                                    </span>
                                ) : 'إرسال رابط الاستعادة'}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
            <Header />
            <ForgotPasswordContent />
        </Suspense>
    );
}
