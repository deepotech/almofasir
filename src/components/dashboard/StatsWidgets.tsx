'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function StatsWidgets() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            fetch(`/api/user/stats?userId=${user.uid}`)
                .then(res => res.json())
                .then(data => {
                    setStats(data.stats);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [user?.uid]);

    if (loading) {
        return <div className="animate-pulse h-32 bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] w-full"></div>;
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Dreams Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📖</div>
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium mb-2">إجمالي الأحلام</h3>
                <p className="text-4xl font-bold text-[var(--color-gold)]">{stats.totalDreams}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">خلال هذا الشهر</p>
            </motion.div>

            {/* Top Symbols Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)]"
            >
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium mb-4">أكثر الرموز تكراراً</h3>
                <div className="space-y-3">
                    {stats.topSymbols?.map((sym: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{sym.name}</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full w-24 overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--color-primary)]"
                                        style={{ width: `${Math.min((sym.count / stats.totalDreams) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-[var(--color-text-muted)]">{sym.count}</span>
                            </div>
                        </div>
                    ))}
                    {(!stats.topSymbols || stats.topSymbols.length === 0) && (
                        <p className="text-xs text-[var(--color-text-muted)]">لا توجد بيانات كافية</p>
                    )}
                </div>
            </motion.div>

            {/* Analytics / Mood Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)]"
            >
                <h3 className="text-[var(--color-text-muted)] text-sm font-medium mb-2">الحالة المزاجية السائدة</h3>
                <div className="flex items-center gap-4 mt-4">
                    <span className="text-4xl">
                        {stats.dominantMood === 'happy' ? '😊' :
                            stats.dominantMood === 'sad' ? '😢' :
                                stats.dominantMood === 'anxious' ? '😰' :
                                    stats.dominantMood === 'confused' ? '🤔' : '😐'}
                    </span>
                    <div>
                        <p className="text-lg font-bold capitalize">
                            {stats.dominantMood === 'happy' ? 'سعيد' :
                                stats.dominantMood === 'sad' ? 'حزين' :
                                    stats.dominantMood === 'anxious' ? 'قلق' :
                                        stats.dominantMood === 'confused' ? 'محتار' : 'محايد'}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">بناءً على تحليلاتنا</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
