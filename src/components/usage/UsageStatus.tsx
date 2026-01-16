'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Clock } from 'lucide-react';

interface UsageData {
    canUseFreeToday: boolean;
    credits: number;
    hoursUntilReset: number;
    plan: string;
}

export default function UsageStatus() {
    const { user } = useAuth();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchUsage = async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/user/usage', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, [user]);

    if (!user || loading || !usage) return null;

    if (usage.canUseFreeToday) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-6 flex items-center gap-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles size={16} />
                </div>
                <div className="text-sm">
                    <p className="text-emerald-400 font-medium">تفسيرك اليومي المجاني متاح</p>
                    <p className="text-emerald-500/70 text-xs">يتجدد رصيدك المجاني غداً</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-center gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={16} />
            </div>
            <div className="text-sm">
                <p className="text-amber-400 font-medium">استخدمت تفسيرك المجاني اليوم</p>
                <div className="flex items-center gap-2 text-amber-500/70 text-xs">
                    <span>يتجدد خلال {usage.hoursUntilReset} ساعة</span>
                    {usage.credits > 0 && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                            <span className="text-white">لديك {usage.credits} رصيد إضافي</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
