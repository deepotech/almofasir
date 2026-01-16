'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface AccountStatusProps {
    plan: string;
    credits: number;
    isDailyFreeAvailable: boolean;
    nextFreeAt: string | null; // ISO string
}

export default function AccountStatusCard({ plan, credits, isDailyFreeAvailable, nextFreeAt }: AccountStatusProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Countdown Logic for Daily Reset
    useEffect(() => {
        if (isDailyFreeAvailable || !nextFreeAt) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(nextFreeAt).getTime();
            const dist = target - now;

            if (dist < 0) {
                setTimeLeft('الآن');
                // Optional: Trigger a soft refresh or callback if needed, but for now just show "Now"
            } else {
                const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}س ${minutes}د`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isDailyFreeAvailable, nextFreeAt]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Daily Free Status Card */}
            <div className={`p-6 rounded-2xl border ${isDailyFreeAvailable
                ? 'bg-emerald-900/20 border-emerald-500/30'
                : 'bg-gray-900/20 border-gray-700/30'} backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={20} className={isDailyFreeAvailable ? 'text-emerald-400' : 'text-gray-400'} />
                            <h3 className="font-bold text-lg text-white">التفسير اليومي المجاني</h3>
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${isDailyFreeAvailable ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {isDailyFreeAvailable ? 'متاح الآن' : 'تم الاستخدام'}
                        </p>
                        {!isDailyFreeAvailable && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-2 bg-black/20 px-3 py-1 rounded-full w-fit">
                                <Clock size={14} />
                                <span>يتجدد خلال: {timeLeft || '...'}</span>
                            </div>
                        )}
                        {isDailyFreeAvailable && (
                            <div className="flex items-center gap-1.5 text-sm text-emerald-400/80 mt-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>جاهز للاستخدام الفوري</span>
                            </div>
                        )}
                    </div>
                    {isDailyFreeAvailable && (
                        <Link href="/dashboard/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
                            فسّر الآن
                        </Link>
                    )}
                </div>
            </div>

            {/* Paid Credits / Plan Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1f3c] to-[#0f1225] border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Crown size={20} className={plan === 'pro' ? 'text-amber-400' : 'text-indigo-400'} />
                            <h3 className="font-bold text-lg text-white">رصيد الباقة الإضافي</h3>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${credits > 0 ? 'text-white' : 'text-gray-500'}`}>
                                {credits}
                            </span>
                            <span className="text-sm text-gray-400">تفسير مدفوع</span>
                        </div>

                        {credits === 0 && (
                            <p className="text-xs text-amber-500/80 mt-2 flex items-center gap-1">
                                <AlertCircle size={12} />
                                رصيدك الإضافي نفد
                            </p>
                        )}
                    </div>

                    <Link href="/pricing" className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${credits === 0
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}>
                        {credits === 0 ? 'شحن الرصيد' : 'شراء المزيد'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
