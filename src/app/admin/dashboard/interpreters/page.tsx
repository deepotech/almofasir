'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Star, Ban, CheckCircle, Trash2, Loader2, Edit, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Interpreter {
    _id: string;
    displayName: string;
    email: string;
    interpretationType: string;
    status: 'active' | 'suspended' | 'pending';
    price: number;
    rating: number;
    totalRatings: number;
    completedDreams: number;
    earnings: number;
}

export default function InterpretersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch Interpreters
    const fetchInterpreters = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/interpreters?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setInterpreters(data.interpreters);
            }
        } catch (error) {
            console.error('Failed to fetch interpreters:', error);
        } finally {
            setLoading(false);
        }
    }, [user, statusFilter, search]);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInterpreters();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchInterpreters]);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        if (!user) return;

        let newStatus = '';
        if (currentStatus === 'active') newStatus = 'suspended';
        else if (currentStatus === 'suspended') newStatus = 'active';
        else if (currentStatus === 'pending') {
            if (!confirm('هل أنت متأكد من تفعيل هذا المفسر الجديد؟')) return;
            newStatus = 'active';
        }

        if (!newStatus) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/interpreters/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Optimistic update
                setInterpreters(prev => prev.map(i =>
                    i._id === id ? { ...i, status: newStatus as any } : i
                ));
            } else {
                alert('فشل تحديث الحالة');
            }
        } catch (error) {
            console.error('Update status error:', error);
            alert('حدث خطأ');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold">إدارة المفسرين</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#0a0a1a] border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-red-500/50"
                    >
                        <option value="all">الكل</option>
                        <option value="active">نشط</option>
                        <option value="suspended">موقوف</option>
                        <option value="pending">معلق</option>
                    </select>

                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث بالاسم أو البريد..."
                            className="w-full bg-[#0a0a1a] border border-white/10 rounded-lg py-2 pr-10 pl-4 focus:border-red-500/50 outline-none transition-all focus:ring-1 focus:ring-red-500/20"
                        />
                        <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
                <table className="w-full text-right">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">المفسر</th>
                            <th className="p-4">النوع</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4">التقييم</th>
                            <th className="p-4">الأرباح</th>
                            <th className="p-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>
                                </td>
                            </tr>
                        ) : interpreters.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-500">
                                    لا يوجد مفسرين مطابقين للبحث
                                </td>
                            </tr>
                        ) : (
                            interpreters.map((interpreter) => (
                                <tr key={interpreter._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-bold text-white group-hover:text-red-400 transition-colors">{interpreter.displayName}</p>
                                            <p className="text-xs text-gray-500">{interpreter.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">{interpreter.interpretationType}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs border font-medium flex items-center gap-1 w-fit ${interpreter.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                interpreter.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {interpreter.status === 'active' ? <CheckCircle size={10} /> :
                                                interpreter.status === 'pending' ? <AlertCircle size={10} /> : <Ban size={10} />}
                                            {interpreter.status === 'active' ? 'نشط' :
                                                interpreter.status === 'pending' ? 'معلق' : 'موقوف'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-amber-400 font-medium bg-amber-500/5 px-2 py-1 rounded w-fit">
                                            <Star size={14} fill="currentColor" />
                                            <span>{interpreter.rating ? interpreter.rating.toFixed(1) : '-'}</span>
                                            <span className="text-gray-600 text-xs">({interpreter.totalRatings})</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-300">
                                        ${interpreter.earnings.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(interpreter._id, interpreter.status)}
                                                className={`p-2 rounded-lg transition-colors tooltip ${interpreter.status === 'active'
                                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                    }`}
                                                title={interpreter.status === 'active' ? 'إيقاف حساب' : 'تفعيل حساب'}
                                            >
                                                {interpreter.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                            </button>

                                            <button
                                                className="p-2 bg-gray-500/10 text-gray-400 hover:text-white rounded-lg hover:bg-gray-500/20"
                                                title="تعديل بيانات (قريباً)"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
