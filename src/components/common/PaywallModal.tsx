'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Crown, User } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'LIMIT_REACHED' | 'FEATURE_LOCKED' | 'GUEST_LIMIT' | 'GUEST_SAVE' | 'DAILY_LIMIT';
}

export default function PaywallModal({ isOpen, onClose, mode }: PaywallModalProps) {
    if (!isOpen) return null;

    // Default content fallback
    let content = {
        title: 'ميزة حصرية',
        subtitle: 'قم بالترقية للوصول لهذه الميزة',
        options: [] as any[]
    };

    if (mode === 'LIMIT_REACHED') {
        content = {
            title: 'انتهت تفسيراتك المجانية',
            subtitle: 'لا تقلق، يمكنك متابعة رحلة فهم رموزك من خلال خياراتنا المرنة',
            options: [
                {
                    title: 'تفسير AI متطور',
                    desc: 'اشتراك شهري أو مرة واحدة',
                    icon: <Sparkles className="text-indigo-400" size={24} />,
                    link: '/pricing?method=ai',
                    color: 'indigo'
                },
                {
                    title: 'تفسير بشري',
                    desc: 'مفسر متخصص يراجع حلمك',
                    icon: <User className="text-emerald-400" size={24} />,
                    link: '/pricing?method=human',
                    color: 'emerald'
                }
            ]
        };
    } else if (mode === 'FEATURE_LOCKED') {
        content = {
            title: 'ميزة للمشتركين فقط',
            subtitle: 'هذه الميزة متاحة ضمن الباقات المدفوعة',
            options: [
                {
                    title: 'ترقية الحساب',
                    desc: 'احصل على وصول كامل',
                    icon: <Crown className="text-yellow-400" size={24} />,
                    link: '/pricing',
                    color: 'yellow'
                }
            ]
        };
    } else if (mode === 'GUEST_LIMIT' || mode === 'GUEST_SAVE') {
        // Fallback for legacy calls or specific guest overrides
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">تسجيل الدخول مطلوب</h2>
                        <p className="text-gray-400 mb-6">يرجى إنشاء حساب للمتابعة وحفظ أحلامك.</p>
                        <Link href="/auth/register" className="btn btn-primary w-full">إنشاء حساب مجاني</Link>
                        <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-white">إغلاق</button>
                    </div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-[#0f1115] border border-gray-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-6 border border-gray-700">
                            <span className="text-3xl">🔒</span>
                        </div>

                        <h2 className="text-2xl font-bold mb-3 text-white">
                            {content.title}
                        </h2>

                        <p className="text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
                            {content.subtitle}
                        </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid gap-4 px-2">
                        {content.options.map((opt, idx) => (
                            <Link
                                key={idx}
                                href={opt.link}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl border transition-all group text-right
                                    ${opt.color === 'indigo' ? 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/10' : ''}
                                    ${opt.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10' : ''}
                                    ${opt.color === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/10' : ''}
                                `}
                            >
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center shrink-0
                                    ${opt.color === 'indigo' ? 'bg-indigo-500/10' : ''}
                                    ${opt.color === 'emerald' ? 'bg-emerald-500/10' : ''}
                                    ${opt.color === 'yellow' ? 'bg-yellow-500/10' : ''}
                                `}>
                                    {opt.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                                        {opt.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {opt.desc}
                                    </p>
                                </div>
                                <div className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="mt-6 text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        ليس الآن، سأقرر لاحقاً
                    </button>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
