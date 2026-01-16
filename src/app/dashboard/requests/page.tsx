'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, ChevronLeft, Star } from 'lucide-react';

interface DreamRequest {
    _id: string;
    dreamText: string;
    status: string;
    price: number;
    createdAt: string;
    interpreterName: string;
    interpretationText?: string;
    rating?: number;
}

export default function UserRequestsPage() {
    const { user, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<DreamRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            fetchRequests();
        }
    }, [user, authLoading]);

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/dream-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            } else {
                toast.error('فشل تحميل قائمة الطلبات');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">جديد</span>;
            case 'in_progress':
                return <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">قيد التفسير</span>;
            case 'completed':
                return <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">مكتمل</span>;
            case 'clarification_requested':
                return <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">بانتظار التوضيح</span>;
            case 'closed':
                return <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">مغلق</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">{status}</span>;
        }
    };

    if (loading || authLoading) return <div className="min-h-screen pt-32 pb-12 flex items-center justify-center text-gray-400">جاري التحميل...</div>;

    // If not logged in, null (middleware handles redirect typically)
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] pt-32 pb-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gold mb-2">طلباتي 📜</h1>
                        <p className="text-gray-400">تاريخ طلباتك المدفوعة لتفسير الأحلام.</p>
                    </div>
                    <Link href="/dashboard" className="btn btn-ghost btn-sm">
                        العودة للرئيسية
                    </Link>
                </header>

                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-4xl block mb-4">📭</span>
                            <h3 className="text-xl font-bold mb-2">لا توجد طلبات سابقة</h3>
                            <p className="text-gray-400 mb-6">لم تقم بطلب تفسير من أحد المفسرين بعد.</p>
                            <Link href="/experts" className="btn btn-primary">
                                تصفح المفسرين
                            </Link>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <Link href={`/dashboard/requests/${req._id}`} key={req._id} className="block group">
                                <div className="glass-card p-6 flex flex-col md:flex-row justify-between gap-4 hover:border-[var(--color-primary)] transition-all relative overflow-hidden">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(req.status)}
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                        <p className="text-white font-medium line-clamp-2 mb-2">
                                            {req.dreamText}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>مع: <span className="text-[var(--color-primary)]">{req.interpreterName}</span></span>
                                            {/* Rating Badge */}
                                            {req.status === 'completed' && (
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${req.rating
                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                                    }`}>
                                                    <Star size={10} fill={req.rating ? 'currentColor' : 'none'} />
                                                    {req.rating ? `${req.rating}/5` : 'غير مقيّم'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-between items-end min-w-[100px]">
                                        <span className="font-bold text-gold">{req.price} SAR</span>
                                        <span className="flex items-center gap-1 text-sm text-[var(--color-primary)] group-hover:translate-x-[-5px] transition-transform">
                                            التفاصيل <ChevronLeft size={16} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
