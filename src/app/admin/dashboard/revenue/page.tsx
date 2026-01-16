'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Download, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

interface RevenueData {
    stats: {
        totalRevenue: number;
        totalCommission: number;
        count: number;
    };
    dailyRevenue: Array<{ _id: string; revenue: number; commission: number }>;
    topInterpreters: Array<{ _id: string; totalGenerated: number; commissionEarned: number }>;
}

export default function RevenuePage() {
    const { user } = useAuth();
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevenue = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/revenue', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                }
            } catch (e) {
                console.error("Failed to fetch revenue", e);
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, [user]);

    if (loading || !data) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">التقارير المالية</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
                    <Download size={16} />
                    <span>تصدير CSV</span>
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} /></div>
                    <p className="text-gray-400 mb-1">إجمالي الإيرادات</p>
                    <h3 className="text-3xl font-bold text-white">${data.stats.totalRevenue.toFixed(2)}</h3>
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> +12% هذا الشهر
                    </p>
                </div>

                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={64} /></div>
                    <p className="text-gray-400 mb-1">عمولة المنصة صافية</p>
                    <h3 className="text-3xl font-bold text-emerald-400">${data.stats.totalCommission.toFixed(2)}</h3>
                    <p className="text-gray-500 text-xs mt-2">من {data.stats.count} معاملة ناجحة</p>
                </div>

                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={64} /></div>
                    <p className="text-gray-400 mb-1">صافي أرباح المفسرين</p>
                    <h3 className="text-3xl font-bold text-blue-400">
                        ${(data.stats.totalRevenue - data.stats.totalCommission).toFixed(2)}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2">مبالغ قابلة للسحب</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6">الإيرادات (آخر 30 يوم)</h3>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.dailyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="_id" stroke="#ffffff40" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#ffffff40" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0a0a1a', borderColor: '#ffffff20', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6">أعلى المفسرين دخلاً</h3>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topInterpreters} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis type="number" stroke="#ffffff40" />
                                <YAxis dataKey="_id" type="category" width={100} stroke="#ffffff80" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0a0a1a', borderColor: '#ffffff20', color: '#fff' }}
                                    cursor={{ fill: '#ffffff10' }}
                                />
                                <Bar dataKey="totalGenerated" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
