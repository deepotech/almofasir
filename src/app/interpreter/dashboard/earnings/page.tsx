'use client';

import { DollarSign, Wallet, ArrowDownLeft, Calendar } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function EarningsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [monthStats, setMonthStats] = useState({ current: 0, change: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch General Stats (Balance, Lifetime Earnings)
                const statsRes = await fetch('/api/interpreter/stats', { headers });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setBalance(statsData.balance || 0);
                    setTotalEarnings(statsData.totalEarnings || 0);
                }

                // 2. Fetch Detailed Earnings History
                const earningsRes = await fetch('/api/interpreter/earnings', { headers });
                if (earningsRes.ok) {
                    const earningsData = await earningsRes.json();
                    setTransactions(earningsData.transactions || []);
                    setMonthStats({
                        current: earningsData.thisMonthTotal || 0,
                        change: earningsData.percentageChange || 0
                    });
                }

            } catch (error) {
                console.error("Failed to fetch earnings data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-emerald-400" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold mb-2">الأرباح والمحفظة</h1>
                <p className="text-gray-400">تابع رصيدك وعملياتك المالية</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-emerald-400 text-sm font-bold mb-1 uppercase tracking-wider">الرصيد القابل للسحب</p>
                            <h2 className="text-4xl font-bold">${balance.toFixed(2)}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <button className="btn btn-primary w-full py-3 shadow-lg shadow-emerald-500/20">
                        طلب سحب أرباح
                    </button>
                    <p className="text-xs text-center mt-3 text-gray-400/80">
                        يتم معالجة الطلبات خلال 3-5 أيام عمل
                    </p>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">أرباح هذا الشهر</p>
                            <h2 className="text-3xl font-bold">${monthStats.current.toFixed(2)}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-2/3"></div>
                    </div>
                    <p className={`text-xs mt-2 ${monthStats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {monthStats.change >= 0 ? '+' : ''}{monthStats.change.toFixed(1)}% مقارنة بالشهر الماضي
                    </p>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">إجمالي الأرباح</p>
                            <h2 className="text-3xl font-bold">${totalEarnings.toFixed(2)}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>عدد الأحلام الكلي:</span>
                        <span className="text-white font-bold">{transactions.filter(t => t.type === 'earning').length}</span>
                    </div>
                </div>
            </div>

            {/* Transactions History */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-lg">سجل العمليات</h3>
                    <button className="text-sm text-[var(--color-primary)] hover:underline">عرض الكل</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4 font-medium">نوع العملية</th>
                                <th className="p-4 font-medium">التاريخ</th>
                                <th className="p-4 font-medium">المبلغ</th>
                                <th className="p-4 font-medium">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد عمليات مسجلة بعد</td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${t.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {t.type === 'withdrawal' ? <ArrowDownLeft size={16} /> : <DollarSign size={16} />}
                                            </div>
                                            <span className="font-medium">{t.description || t.type}</span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} /> {new Date(t.createdAt).toLocaleDateString('ar-EG')}
                                            </div>
                                        </td>
                                        <td className={`p-4 font-bold ${t.type === 'withdrawal' || t.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {t.type === 'withdrawal' ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs border ${t.status === 'pending'
                                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                : t.status === 'failed'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                {t.status === 'pending' ? 'قيد المعالجة' : t.status === 'failed' ? 'فشل' : 'مكتمل'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
