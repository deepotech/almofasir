'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, RefreshCw, XCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Order {
    _id: string;
    type: 'HUMAN' | 'AI';
    userEmail: string;
    interpreterName?: string;
    status: string;
    paymentStatus: string;
    price: number;
    createdAt: string;
    dreamText: string;
}

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [fitlerType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams();
            if (fitlerType !== 'all') params.append('type', fitlerType);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (search) params.append('search', search);
            params.append('page', page.toString());
            params.append('limit', '20');

            const res = await fetch(`/api/admin/orders?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Fetch orders failed', error);
        } finally {
            setLoading(false);
        }
    }, [user, fitlerType, filterStatus, search, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-1"><CheckCircle size={12} /> مكتمل</span>;
            case 'new': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs flex items-center gap-1"><AlertTriangle size={12} /> جديد</span>;
            case 'in_progress': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs flex items-center gap-1"><RefreshCw size={12} /> قيد التنفيذ</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs flex items-center gap-1"><XCircle size={12} /> ملغي</span>;
            default: return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-lg text-xs">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold">مركز التحكم بالطلبات</h1>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select
                        value={fitlerType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-[#0a0a1a] border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-red-500/50"
                    >
                        <option value="all">كل الأنواع</option>
                        <option value="HUMAN">مفسرين</option>
                        <option value="AI">AI</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0a0a1a] border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-red-500/50"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="new">جديد</option>
                        <option value="assigned">تم التعيين</option>
                        <option value="in_progress">قيد التنفيذ</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                    </select>

                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث برقم الطلب أو الإيميل..."
                            className="w-full bg-[#0a0a1a] border border-white/10 rounded-lg py-2 pr-10 pl-4 focus:border-red-500/50 outline-none"
                        />
                        <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden min-h-[500px]">
                <table className="w-full text-right">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">رقم الطلب</th>
                            <th className="p-4">المستخدم</th>
                            <th className="p-4">النوع / المفسر</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4">السعر</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin inline text-gray-500" /></td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-gray-500">لا توجد طلبات مطابقة</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order._id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 font-mono text-gray-400">...{order._id.slice(-6)}</td>
                                    <td className="p-4 font-medium">{order.userEmail}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${order.type === 'AI' ? 'text-indigo-400' : 'text-amber-400'}`}>{order.type}</span>
                                            {order.interpreterName && <span className="text-gray-500 text-xs">{order.interpreterName}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">{getStatusBadge(order.status)}</td>
                                    <td className="p-4 font-mono text-emerald-400">${order.price}</td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button className="p-1.5 hover:bg-white/10 rounded text-blue-400" title="عرض التفاصيل">
                                                <Eye size={16} />
                                            </button>
                                            {order.status === 'new' && order.type === 'HUMAN' && (
                                                <button className="p-1.5 hover:bg-white/10 rounded text-orange-400" title="إعادة تعيين">
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-50 hover:bg-white/10"
                >
                    السابق
                </button>
                <span className="px-4 py-2 text-gray-400">صفحة {page} من {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-50 hover:bg-white/10"
                >
                    التالي
                </button>
            </div>
        </div>
    );
}
