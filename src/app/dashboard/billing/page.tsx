'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
    CreditCard,
    Crown,
    History,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2,
    Zap
} from 'lucide-react';

export default function BillingPage() {
    const { user, loading: authLoading } = useAuth();
    const [billingData, setBillingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBilling = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/user/billing', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBillingData(data);
                }
            } catch (error) {
                console.error("Failed to fetch billing", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchBilling();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
            </div>
        );
    }

    const plan = billingData?.plan || 'free';
    const isPro = plan === 'pro' || plan === 'premium';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <CreditCard className="text-[var(--color-primary)]" />
                        الفواتير والاشتراكات
                    </h1>
                    <p className="text-gray-400 mt-1">إدارة خطتك الحالية وسجل المدفوعات</p>
                </div>
            </div>

            {/* Current Plan Card */}
            <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${isPro ? 'bg-amber-500/20' : 'bg-gray-500/20'}`}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700/50 text-gray-400'}`}>
                            <Crown />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold">الخطة الحالية</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-300'}`}>
                                    {plan === 'premium' ? 'شاملة (Premium)' : plan === 'pro' ? 'احترافية (Pro)' : 'مجانية (Free)'}
                                </span>
                            </div>
                            <p className="text-gray-400">
                                {isPro
                                    ? 'تمتع بجميع مزايا العضوية المميزة.'
                                    : 'أنت تستخدم الخطة المجانية المحدودة.'}
                            </p>
                        </div>
                    </div>

                    {!isPro && (
                        <Link href="/pricing" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2">
                            <Zap size={18} />
                            ترقية الآن
                        </Link>
                    )}
                </div>
            </div>

            {/* Credits Balance (Optional - verify if user model has credits) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-400" size={20} />
                        رصيد التفسيرات
                    </h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold">{billingData?.credits || 0}</span>
                        <span className="text-gray-400 mb-2">رصيد</span>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-white/5 opacity-75">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="text-blue-400" size={20} />
                        طريقة الدفع
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span>لم تتم إضافة بطاقة</span>
                        </div>
                        <button className="text-sm text-[var(--color-primary)] hover:underline" disabled>
                            إدارة (قريباً)
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <History size={20} className="text-gray-400" />
                    سجل المدفوعات
                </h3>

                <div className="glass-card rounded-xl overflow-hidden border border-white/5">
                    {billingData?.transactions?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 text-gray-400 text-sm">
                                    <tr>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4">الخدمة</th>
                                        <th className="p-4">المبلغ</th>
                                        <th className="p-4">الحالة</th>
                                        <th className="p-4">إيصال</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {billingData.transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-gray-300">
                                                {new Date(tx.date).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="p-4 font-medium">
                                                {tx.description}
                                            </td>
                                            <td className="p-4 text-emerald-400 font-bold dir-ltr text-right">
                                                ${tx.amount}
                                            </td>
                                            <td className="p-4">
                                                {tx.status === 'paid' || tx.status === 'released' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                        <CheckCircle size={12} /> مدفوع
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                                                        <AlertCircle size={12} /> {tx.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                <button className="hover:text-white transition-colors" title="تحميل الإيصال (قريباً)">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>لا توجد مدفوعات سابقة.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
