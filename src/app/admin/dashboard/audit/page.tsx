'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, Loader2, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuditLog {
    _id: string;
    adminEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    details: any;
    ipAddress: string;
    createdAt: string;
}

export default function AuditLogPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [actionFilter, setActionFilter] = useState('all');

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams();
            if (actionFilter !== 'all') params.append('action', actionFilter);
            params.append('page', page.toString());
            params.append('limit', '20');

            const res = await fetch(`/api/admin/audit-log?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    }, [user, actionFilter, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatAction = (action: string) => {
        const labels: Record<string, string> = {
            'approve_interpreter': 'قبول مفسر',
            'suspend_interpreter': 'إيقاف مفسر',
            'reactivate_interpreter': 'إعادة تفعيل',
            'edit_price': 'تعديل سعر',
            'update_settings': 'تحديث إعدادات',
            'refund_order': 'استرجاع طلب',
            'reassign_order': 'إعادة تعيين',
            'login': 'تسجيل دخول'
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        if (action.includes('suspend') || action.includes('refund')) return 'text-red-400 bg-red-500/10';
        if (action.includes('approve') || action.includes('reactivate')) return 'text-emerald-400 bg-emerald-500/10';
        return 'text-blue-400 bg-blue-500/10';
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-red-500" />
                    سجلات النظام والأمان
                </h1>

                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="bg-[#0a0a1a] border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-red-500/50"
                >
                    <option value="all">كل الإجراءات</option>
                    <option value="update_settings">تحديث إعدادات</option>
                    <option value="approve_interpreter">قبول مفسر</option>
                    <option value="suspend_interpreter">إيقاف مفسر</option>
                    <option value="refund_order">استرجاع أموال</option>
                </select>
            </div>

            <div className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden min-h-[500px]">
                <table className="w-full text-right">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">المسؤول</th>
                            <th className="p-4">الإجراء</th>
                            <th className="p-4">التفاصيل</th>
                            <th className="p-4">IP Address</th>
                            <th className="p-4">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin inline text-gray-500" /></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-500">لا توجد سجلات</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log._id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 font-medium">{log.adminEmail}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>
                                    <td className="p-4 max-w-md">
                                        <div className="bg-black/30 p-2 rounded text-xs font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-20 overflow-y-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-500 text-xs">{log.ipAddress}</td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {new Date(log.createdAt).toLocaleString('en-GB')}
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
