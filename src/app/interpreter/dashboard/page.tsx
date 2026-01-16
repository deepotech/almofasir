'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    MessageSquare,
    CheckCircle,
    DollarSign,
    Star,
    ArrowUpRight,
    TrendingUp,
    Loader2
} from 'lucide-react';

interface DashboardStats {
    newDreams: number;
    completedDreams: number;
    balance: number;
    rating: number;
    totalRatings: number;
}

interface RecentRequest {
    _id: string;
    content: string;
    createdAt: string;
    interpretationType?: string;
}

export default function InterpreterDashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Fetch Request List (Only for Recent Requests display)
                // We still need this for the bottom list, but NOT for stats.
                const requestsRes = await fetch('/api/interpreter/dream-requests', { headers });

                // 2. Fetch REAL Stats (Balance, Counts) - Source of Truth
                const statsRes = await fetch('/api/interpreter/stats', { headers });

                // 3. Fetch Profile (For Rating / Display info)
                const profileRes = await fetch('/api/user/profile', { headers });

                let recent: RecentRequest[] = [];

                // Process Requests List
                if (requestsRes.ok) {
                    const requestsData = await requestsRes.json();
                    const requests = requestsData.requests || [];

                    recent = requests.slice(0, 3).map((r: any) => ({
                        _id: r._id,
                        content: r.dreamText,
                        createdAt: r.createdAt,
                        interpretationType: r.currency || 'USD' // Fallback
                    }));

                    // FRONTEND DEDUPLICATION: Ensure unique _id
                    const seen = new Set();
                    recent = recent.filter(r => {
                        const duplicate = seen.has(r._id);
                        seen.add(r._id);
                        return !duplicate;
                    });
                }

                // Process Stats
                let dashboardStats: DashboardStats = {
                    newDreams: 0,
                    completedDreams: 0,
                    balance: 0,
                    rating: 0,
                    totalRatings: 0
                };

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    dashboardStats = {
                        ...dashboardStats,
                        newDreams: statsData.pendingRequests || 0,
                        completedDreams: statsData.completedRequests || 0,
                        balance: statsData.balance || 0 // Real balance from Transactions
                    };
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.interpreter) {
                        dashboardStats.rating = profileData.interpreter.rating || 0;
                        dashboardStats.totalRatings = profileData.interpreter.totalRatings || 0;
                    }
                }

                setStats(dashboardStats);
                setRecentRequests(recent);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const statsDisplay = [
        { label: 'أحلام جديدة', value: stats?.newDreams?.toString() || '0', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'أحلام مكتملة', value: stats?.completedDreams?.toString() || '0', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'رصيدك الحالي', value: `$${(stats?.balance || 0).toFixed(2)}`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'تقييمك', value: `${(stats?.rating || 0).toFixed(1)} / 5`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];


    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-purple-400" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold mb-2">مرحباً، مفسّرنا العزيز 👋</h1>
                <p className="text-gray-400">إليك نظرة سريعة على أدائك اليوم.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsDisplay.map((stat, idx) => (
                    <div key={idx} className="glass-card p-6 flex flex-col justify-between hover:border-[var(--color-primary)]/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={stat.color} size={24} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity & chart placeholder could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions / Notifications */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">آخر الأحلام الواصلة</h2>
                        <a href="/interpreter/dashboard/dreams" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                            عرض الكل <ArrowUpRight size={16} />
                        </a>
                    </div>

                    <div className="space-y-4">
                        {recentRequests.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                <p>لا توجد طلبات جديدة حالياً</p>
                            </div>
                        ) : (
                            recentRequests.map((req) => (
                                <a key={req._id} href={`/interpreter/dashboard/requests/${req._id}`} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                                            🌙
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-md mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                                {req.content.substring(0, 50)}...
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                {new Date(req.createdAt).toLocaleDateString('ar-EG')} • {req.interpretationType || 'شرعي'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20">جديد</span>
                                </a>
                            ))
                        )}
                    </div>
                </div>

                {/* System Tips */}
                <div className="glass-card p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                    <h2 className="text-xl font-bold mb-4">💡 نصيحة اليوم</h2>
                    <p className="text-gray-300 leading-relaxed mb-6">
                        "استخدامك للغة واضحة ومباشرة يزيد من رضا المستفيد. حاول دائماً ربط الرموز بحال الرائي المذكور في النموذج."
                    </p>
                    <div className="h-px bg-white/10 mb-6"></div>
                    <div>
                        <h3 className="font-bold mb-3 text-sm text-gray-200">أدوات مساعدة:</h3>
                        <div className="flex gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-xs hover:bg-white/10 cursor-pointer border border-white/5">قاموس الرموز</span>
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-xs hover:bg-white/10 cursor-pointer border border-white/5">قوالب جاهزة</span>
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-xs hover:bg-white/10 cursor-pointer border border-white/5">دعم المفسرين</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
