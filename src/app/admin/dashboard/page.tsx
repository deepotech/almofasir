'use client';

import {
    Users,
    UserCheck,
    MessageSquare,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import UrgentOrdersPanel from '@/components/admin/UrgentOrdersPanel';
import QuickActions from '@/components/admin/QuickActions';

interface StatsData {
    dreamsToday: number;
    paidOrdersToday: number;
    paidOrdersWeek: number;
    totalRevenue: number;
    platformCommission: number;
    activeInterpreters: number;
    pendingOrders: number;
    aiFailures: number;
    commissionRate: number;
}

export default function AdminOverviewPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsData>({
        dreamsToday: 0,
        paidOrdersToday: 0,
        paidOrdersWeek: 0,
        totalRevenue: 0,
        platformCommission: 0,
        activeInterpreters: 0,
        pendingOrders: 0,
        aiFailures: 0,
        commissionRate: 0.3
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/stats/overview', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    console.error('Failed to fetch admin stats');
                }
            } catch (e) {
                console.error("Stats fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    // KPI Definitions for easy mapping
    const kpis = [
        {
            label: 'إجمالي الأحلام (اليوم)',
            value: stats.dreamsToday.toLocaleString(),
            subValue: `${stats.paidOrdersToday} مدفوع`,
            icon: MessageSquare,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            href: '/admin/dashboard/orders?date=today'
        },
        {
            label: 'المفسرين النشطين',
            value: stats.activeInterpreters.toString(),
            subValue: 'خلال 24 ساعة',
            icon: UserCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            href: '/admin/dashboard/interpreters?status=active'
        },
        {
            label: 'طلبات عالقة',
            value: stats.pendingOrders.toString(),
            subValue: 'تحتاج تدخل',
            icon: AlertTriangle,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            href: '/admin/dashboard/orders?status=new&stuck=true'
        },
        {
            label: 'أرباح المنصة',
            value: `$${stats.platformCommission.toFixed(2)}`,
            subValue: `من إجمالي $${stats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            href: '/admin/dashboard/revenue'
        },
    ];

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Urgent Action Panel - Phase 2 */}
            <UrgentOrdersPanel />

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <Link key={idx} href={kpi.href}>
                        <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl flex items-center justify-between hover:border-white/20 transition-all cursor-pointer group">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">{kpi.label}</p>
                                <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform origin-right">{kpi.value}</h3>
                                <p className="text-xs text-gray-500 mt-1">{kpi.subValue}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${kpi.bg}`}>
                                <kpi.icon className={kpi.color} size={24} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-400" />
                                حالة النظام
                            </h2>
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                                Operational
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <div className="text-sm text-gray-400 mb-2">نسبة فشل AI</div>
                                <div className={`text-xl font-bold ${stats.aiFailures > 5 ? 'text-red-400' : 'text-white'}`}>
                                    {stats.aiFailures} <span className="text-xs font-normal text-gray-500">حالات</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <div className="text-sm text-gray-400 mb-2">نسبة العمولة الحالية</div>
                                <div className="text-xl font-bold text-white">
                                    {(stats.commissionRate * 100)}%
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <div className="text-sm text-gray-400 mb-2">حجم التعاملات (أسبوع)</div>
                                <div className="text-xl font-bold text-white">
                                    {stats.paidOrdersWeek} <span className="text-xs font-normal text-gray-500">طلب</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Link href="/admin/dashboard/orders" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                عرض كل الأنشطة <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Actions - Phase 4 */}
                    <QuickActions />
                </div>

                {/* Alerts & Actions */}
                <div className="space-y-6">
                    <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6 h-full">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            تنبيهات عاجلة
                        </h2>

                        {stats.pendingOrders > 0 ? (
                            <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg mb-3">
                                <span className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"></span>
                                <div>
                                    <p className="text-sm font-medium text-red-200">{stats.pendingOrders} طلبات متأخرة</p>
                                    <p className="text-xs text-red-400/60">تجاوزت الوقت المحدد</p>
                                </div>
                                <Link href="/admin/dashboard/orders?status=new&stuck=true" className="text-xs text-red-400 hover:text-red-300 mr-auto underline">
                                    معالجة
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <p>لا توجد تنبيهات عاجلة ✅</p>
                            </div>
                        )}

                        {stats.aiFailures > 0 && (
                            <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                                <span className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0"></span>
                                <div>
                                    <p className="text-sm font-medium text-orange-200">{stats.aiFailures} فشل في الذكاء الاصطناعي</p>
                                    <p className="text-xs text-orange-400/60">يرجى مراجعة السجلات</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
