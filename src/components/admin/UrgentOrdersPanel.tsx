'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UrgentOrder {
    id: string;
    type: 'HUMAN' | 'AI';
    status: string;
    customer: string;
    interpreter: string;
    waitingTimeHours: number;
    lastUpdateHours: number;
    amount: number;
}

export default function UrgentOrdersPanel() {
    const [orders, setOrders] = useState<UrgentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUrgent = async () => {
            try {
                // In a real app, use auth token interceptor or passes
                // Assuming session handled by stored cookie/token mechanism in fetch default or context
                // For this snippet, we assume standard fetch plays nice with Next.js middleware/cookies
                // If we need token header, we grab it from context.
                const userToken = sessionStorage.getItem('userToken'); // fallback or use context if standard
                // Simplifying for 'useAuth' context pattern if available in parent

                // We'll rely on the parent page passing auth or simple fetch if cookies work
                const res = await fetch('/api/admin/orders/urgent');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (e) {
                console.error("Failed to load urgent orders", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUrgent();
    }, []);

    if (loading) return <div className="h-48 animate-pulse bg-white/5 rounded-xl"></div>;
    if (orders.length === 0) return null; // Hide if empty

    return (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-red-100 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    طلبات تحتاج تدخل فوري
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {orders.length}
                    </span>
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead className="text-gray-400 border-b border-white/5">
                        <tr>
                            <th className="pb-3 font-medium">نوع الطلب</th>
                            <th className="pb-3 font-medium">العميل</th>
                            <th className="pb-3 font-medium">الانتظار</th>
                            <th className="pb-3 font-medium">الحالة</th>
                            <th className="pb-3 font-medium">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.map((order) => (
                            <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.type === 'AI' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                        }`}>
                                        {order.type}
                                    </span>
                                </td>
                                <td className="py-4 text-gray-300 font-mono">{order.customer}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2 text-red-300">
                                        <Clock size={14} />
                                        <span className="font-bold">{order.waitingTimeHours} ساعة</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">تحديث: منذ {order.lastUpdateHours} س</div>
                                </td>
                                <td className="py-4">
                                    <span className="text-gray-400">{order.status}</span>
                                    {order.interpreter !== 'Unassigned' && (
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <User size={10} /> {order.interpreter}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/dashboard/orders/${order.id}`}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                                        >
                                            إدارة <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
