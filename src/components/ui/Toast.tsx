'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible && !message) return null;

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-[var(--color-bg-secondary)] border-gold'
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    return (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border border-white/10 ${bgColors[type]} text-white transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <span className="text-lg">{icons[type]}</span>
            <span className="font-medium text-sm">{message}</span>
        </div>
    );
}
