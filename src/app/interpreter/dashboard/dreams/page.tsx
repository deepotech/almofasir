'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MessageSquare, Clock, DollarSign, AlertTriangle, CheckCircle, Play } from 'lucide-react';

interface HumanDream {
    _id: string;
    content: string;
    context: {
        gender?: string;
        socialStatus?: string;
        ageRange?: string;
        dominantFeeling?: string;
    };
    price: number;
    interpreterEarning: number;
    status: string;
    deadline: string;
    createdAt: string;
}

interface Stats {
    pending: number;
    inProgress: number;
    completed: number;
}

export default function InterpreterDreamsPage() {
    const { user } = useAuth();
    const [dreams, setDreams] = useState<HumanDream[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, inProgress: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending_interpretation' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        if (user) fetchDreams();
    }, [user, filter]);

    const fetchDreams = async () => {
        try {
            const token = await user!.getIdToken();
            let url = '/api/interpreter/dreams';
            if (filter !== 'all') {
                url += `?status=${filter}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDreams(data.dreams);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching dreams:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { text: string; class: string; icon: React.ReactNode }> = {
            'pending_interpretation': {
                text: 'جديد',
                class: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                icon: <MessageSquare size={14} />
            },
            'in_progress': {
                text: 'قيد التفسير',
                class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: <Play size={14} />
            },
            'completed': {
                text: 'مكتمل',
                class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: <CheckCircle size={14} />
            }
        };
        const badge = badges[status] || badges['pending_interpretation'];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${badge.class}`}>
                {badge.icon}
                {badge.text}
            </span>
        );
    };

    const getTimeRemaining = (deadline: string) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate.getTime() - now.getTime();

        if (diff < 0) return { text: 'متأخر', urgent: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 3) return { text: `${hours}س ${minutes}د`, urgent: true };
        if (hours < 12) return { text: `${hours} ساعة`, urgent: false };
        return { text: `${Math.ceil(hours / 24)} يوم`, urgent: false };
    };

    const getContextInfo = (context: HumanDream['context']) => {
        const parts = [];
        if (context.gender === 'male') parts.push('ذكر');
        if (context.gender === 'female') parts.push('أنثى');
        if (context.socialStatus) {
            const statuses: Record<string, string> = {
                'single': 'أعزب',
                'married': 'متزوج',
                'divorced': 'مطلق',
                'widowed': 'أرمل'
            };
            parts.push(statuses[context.socialStatus] || context.socialStatus);
        }
        return parts.join(' • ') || 'غير محدد';
    };

    if (loading) {
        return (
            <div className="animate-fadeIn space-y-6">
                <div className="h-8 bg-white/5 rounded w-48 animate-pulse"></div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold mb-2">الأحلام الواردة</h1>
                <p className="text-gray-400">إدارة طلبات التفسير المرسلة إليك</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                        <MessageSquare className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stats.pending}</h3>
                        <p className="text-gray-400 text-sm">أحلام جديدة</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10">
                        <Clock className="text-amber-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
                        <p className="text-gray-400 text-sm">قيد التفسير</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10">
                        <CheckCircle className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stats.completed}</h3>
                        <p className="text-gray-400 text-sm">مكتملة</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: 'all', label: 'الكل' },
                    { value: 'pending_interpretation', label: 'جديد' },
                    { value: 'in_progress', label: 'قيد التفسير' },
                    { value: 'completed', label: 'مكتمل' }
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as typeof filter)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === tab.value
                                ? 'bg-[var(--color-primary)] text-black font-bold'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dreams List */}
            {dreams.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <h2 className="text-xl font-bold mb-2">لا توجد أحلام</h2>
                    <p className="text-gray-400">لم تصلك أي طلبات تفسير بعد</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {dreams.map(dream => {
                        const timeRemaining = getTimeRemaining(dream.deadline);
                        return (
                            <Link
                                key={dream._id}
                                href={`/interpreter/dashboard/dreams/${dream._id}`}
                                className="block glass-card p-6 hover:border-[var(--color-primary)]/50 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {getStatusBadge(dream.status)}
                                            {dream.status !== 'completed' && (
                                                <span className={`flex items-center gap-1 text-xs ${timeRemaining.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                                                    {timeRemaining.urgent && <AlertTriangle size={14} />}
                                                    <Clock size={14} />
                                                    {timeRemaining.text}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-300 line-clamp-2 mb-3">
                                            {dream.content}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{getContextInfo(dream.context)}</span>
                                            <span>•</span>
                                            <span>{new Date(dream.createdAt).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <div className="text-lg font-bold text-emerald-400">
                                            ${dream.interpreterEarning.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-gray-500">أرباحك</p>
                                    </div>
                                </div>

                                {dream.status === 'pending_interpretation' && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <span className="text-sm text-[var(--color-primary)] group-hover:underline">
                                            بدء التفسير ←
                                        </span>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
