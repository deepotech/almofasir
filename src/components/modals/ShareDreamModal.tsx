'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ShareDreamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isPublishing: boolean;
}

export default function ShareDreamModal({ isOpen, onClose, onConfirm, isPublishing }: ShareDreamModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isPublishing ? undefined : onClose}></div>
            <div className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fadeInUp">

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        🤝
                    </div>
                    <h3 className="text-xl font-bold mb-2">هل تود مساعدتنا؟</h3>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-4">
                        نرغب في نشر هذا الحلم مع تفسيره ضمن قسم "أحلام تم تفسيرها" ليستفيد منه الآخرون.
                        <br />
                        <span className="text-[var(--color-secondary)] font-medium">سيتم النشر بدون اسمك أو أي معلومات شخصية، وبصياغة تحمي خصوصيتك بالكامل.</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        القرار يعود لك، ويمكنك الرفض دون أي تأثير.
                    </p>
                </div>

                <div className="flex gap-3 mb-4">
                    <button
                        onClick={onConfirm}
                        disabled={isPublishing}
                        className="btn btn-primary flex-1"
                    >
                        {isPublishing ? (
                            <>
                                <span className="loading-spinner w-4 h-4"></span>
                                جاري المعالجة...
                            </>
                        ) : (
                            '✅ أوافق على النشر'
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isPublishing}
                        className="btn btn-ghost flex-1 opacity-70 hover:opacity-100"
                    >
                        ❌ لا، شكرًا
                    </button>
                </div>

                <div className="text-center">
                    <span className="text-xs text-gold/80">
                        ✨ مساهمتك قد تساعد شخصًا آخر يمر بتجربة مشابهة
                    </span>
                </div>
            </div>
        </div>
    );
}
