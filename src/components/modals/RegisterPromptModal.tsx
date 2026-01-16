'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, UserPlus, Sparkles } from 'lucide-react';

interface RegisterPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisterPromptModal({ isOpen, onClose }: RegisterPromptModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fadeInUp">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                        <UserPlus size={32} className="text-indigo-400" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-white">
                        استخدمت تفسيرك المجاني الأول
                    </h3>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        للحصول على <span className="text-indigo-400 font-bold">تفسير إضافي مجاني</span> وحفظ أحلامك في سجلك الخاص، قم بإنشاء حساب مجاني الآن.
                    </p>

                    <Link
                        href="/auth/register"
                        className="w-full py-4 rounded-xl font-bold text-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mb-4"
                    >
                        <Sparkles size={20} />
                        <span>تسجيل حساب جديد مجاني</span>
                    </Link>

                    <div className="text-sm text-gray-500">
                        لدي حساب بالفعل؟{' '}
                        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
