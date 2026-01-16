'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
    Moon,
    Clock,
    CheckCircle,
    Wallet,
    Plus,
    ArrowLeft,
    Loader2,
    Crown,
    Star,
    UserCheck
} from 'lucide-react';
import DreamCard from '@/components/dashboard/DreamCard';
import AccountStatusCard from '@/components/dashboard/AccountStatusCard'; // NEW COMPONENT

// Highlight Card for Human Interpretation Upsell
function HumanInterpreterPromo() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/40 via-purple-900/40 to-indigo-900/40 border border-amber-500/20 p-8 text-right animate-fadeIn mb-8">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                        <Star size={14} className="fill-amber-400" />
                        <span>تفسير احترافي</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                        ✨ هل تريد تفسيرًا أدق من مفسر حقيقي؟
                    </h2>

                    <p className="text-gray-300 leading-relaxed max-w-2xl">
                        اختر مفسر أحلام مختص، اطّلع على تقييماته وأسعاره، واحصل على تفسير شخصي ومفصل لحلمك بناءً على الكتاب والسنة.
                    </p>

                    <ul className="flex flex-wrap gap-4 text-sm text-gray-400 mt-4">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            تواصل مباشر مع المفسر
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            اختيار السعر المناسب لك
                        </li>
                    </ul>
                </div>

                <div className="flex-shrink-0">
                    <Link
                        href="/experts"
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                    >
                        <UserCheck size={20} />
                        اختر مفسر أحلام الآن
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Simple Stats Component - Inline to ensure correct order and keys
function DashboardStats({ stats }: { stats: any }) {
    if (!stats) return null;

    // Requested Order: Completed, Pending, Total, Payments
    const cards = [
        {
            label: 'تم تفسيرها',
            value: stats.completedRequests || 0,
            icon: CheckCircle,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        },
        {
            label: 'قيد الانتظار',
            value: stats.pendingRequests || 0,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            label: 'أحلامي',
            value: stats.totalRequests || 0,
            icon: Moon,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        },
        {
            label: 'المدفوعات',
            value: `$${stats.totalSpent || 0}`,
            icon: Wallet,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map((card, idx) => (
                <div key={idx} className="glass-card p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary)]/30 transition-colors">
                    <div className={`p-3 rounded-full ${card.bg} mb-3`}>
                        <card.icon className={card.color} size={24} />
                    </div>
                    <span className="text-2xl font-bold mb-1">{card.value}</span>
                    <span className="text-xs text-gray-400">{card.label}</span>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch Real Stats (Now includes Plan, Credits, Daily Status)
                const statsRes = await fetch('/api/user/stats', { headers });
                const statsData = await statsRes.json();
                setStats(statsData);

                // 2. Fetch Recent Requests (Dream Requests, not Journal)
                const requestsRes = await fetch('/api/user/requests?limit=6', { headers });
                const requestsData = await requestsRes.json();
                setRecentRequests(requestsData.requests || []);

            } catch (error) {
                console.error("Dashboard load failed", error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && user) {
            loadDashboard();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
            </div>
        );
    }

    const hasRequests = recentRequests.length > 0;

    // Show Highlight Card ONLY if user has NEVER made a human request (stats.totalRequests === 0)
    const showHighlightCard = stats && stats.totalRequests === 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">

            {/* NEW: Account Status Card (Single Source of Truth) */}
            {stats && (
                <AccountStatusCard
                    plan={stats.plan}
                    credits={stats.credits}
                    isDailyFreeAvailable={stats.isDailyFreeAvailable}
                    nextFreeAt={stats.nextFreeAt}
                />
            )}

            {/* Real Stats */}
            <DashboardStats stats={stats} />

            {/* UPSELL: Human Interpreter Highlight Card (New Users / AI Only) */}
            {showHighlightCard && <HumanInterpreterPromo />}

            {/* My Dreams Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span>📚</span> أحلامي الأخيرة
                    </h2>
                    {hasRequests && (
                        <Link href="/dashboard/requests" className="text-sm text-[var(--color-primary)] hover:text-white flex items-center gap-1 transition-colors">
                            عرض كل الأحلام <ArrowLeft size={16} />
                        </Link>
                    )}
                </div>

                {!hasRequests ? (
                    <div className="text-center py-16 glass-card rounded-2xl border-dashed border-2 border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">لم تقم بإرسال أي حلم بعد</h3>
                        <p className="text-gray-400 mb-6">ابدأ الآن بتفسير حلمك الأول واكتشف رسائله.</p>
                        <Link href="/dashboard/new" className="text-[var(--color-primary)] hover:underline">
                            إرسال حلم جديد
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentRequests.map((req) => (
                            <DreamCard
                                key={req._id}
                                dream={{
                                    id: req._id,
                                    title: 'طلب تفسير',
                                    date: req.createdAt,
                                    preview: req.dreamText || '',
                                    mood: 'neutral',
                                    interpreter: req.interpreterName,
                                    tags: [],
                                    aiGenerated: false,
                                    status: req.status === 'completed' || req.status === 'closed' ? 'completed'
                                        : req.status === 'clarification_requested' ? 'reviewed'
                                            : 'pending'
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
