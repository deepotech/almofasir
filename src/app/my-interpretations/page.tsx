'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Clock, CheckCircle, MessageSquare, Star, AlertTriangle } from 'lucide-react';

interface HumanDream {
    _id: string;
    interpreterName: string;
    content: string;
    interpretation?: string;
    price: number;
    status: string;
    deadline: string;
    rating?: {
        score: number;
        comment?: string;
    };
    createdAt: string;
    completedAt?: string;
}

export default function MyInterpretationsPage() {
    const { user } = useAuth();
    const [dreams, setDreams] = useState<HumanDream[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchDreams();
    }, [user]);

    const fetchDreams = async () => {
        try {
            const token = await user!.getIdToken();
            // Updated to use unified /api/orders endpoint
            const res = await fetch('/api/orders?type=HUMAN', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map orders to match HumanDream interface
                const mappedDreams = data.orders?.map((order: any) => ({
                    _id: order._id,
                    interpreterName: order.interpreterName || 'مفسر',
                    content: order.dreamText,
                    interpretation: order.interpretationText,
                    price: order.price || 0,
                    status: order.status,
                    deadline: order.deadline,
                    rating: order.rating ? { score: order.rating, comment: order.feedback } : undefined,
                    createdAt: order.createdAt,
                    completedAt: order.completedAt
                })) || [];
                setDreams(mappedDreams);
            }
        } catch (error) {
            console.error('Error fetching dreams:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const statuses: Record<string, { text: string; class: string; icon: React.ReactNode }> = {
            'pending_interpretation': {
                text: 'في انتظار التفسير',
                class: 'bg-blue-500/10 text-blue-400',
                icon: <Clock size={16} />
            },
            'in_progress': {
                text: 'جاري التفسير',
                class: 'bg-amber-500/10 text-amber-400',
                icon: <MessageSquare size={16} />
            },
            'completed': {
                text: 'مكتمل',
                class: 'bg-emerald-500/10 text-emerald-400',
                icon: <CheckCircle size={16} />
            },
            'disputed': {
                text: 'قيد المراجعة',
                class: 'bg-red-500/10 text-red-400',
                icon: <AlertTriangle size={16} />
            }
        };
        return statuses[status] || statuses['pending_interpretation'];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-white">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12" style={{ marginTop: 100 }}>
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">تفسيراتي</h1>
                    <p className="text-gray-400 mb-8">تتبع طلبات التفسير من المفسرين الحقيقيين</p>

                    {dreams.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">📭</div>
                            <h2 className="text-xl font-bold mb-2">لا توجد طلبات</h2>
                            <p className="text-gray-400 mb-6">لم تطلب أي تفسير من مفسر حقيقي بعد</p>
                            <Link
                                href="/experts"
                                className="inline-block px-6 py-3 bg-[var(--color-primary)] text-black font-bold rounded-xl hover:scale-105 transition-all"
                            >
                                اختر مفسّر الآن
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dreams.map(dream => {
                                const statusInfo = getStatusInfo(dream.status);
                                return (
                                    <Link
                                        key={dream._id}
                                        href={`/my-interpretations/${dream._id}`}
                                        className="block bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[var(--color-primary)]/50 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${statusInfo.class}`}>
                                                        {statusInfo.icon}
                                                        {statusInfo.text}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        المفسر: {dream.interpreterName}
                                                    </span>
                                                </div>

                                                <p className="text-gray-300 line-clamp-2 mb-3">
                                                    {dream.content}
                                                </p>

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>
                                                        {dream.createdAt && !isNaN(new Date(dream.createdAt).getTime())
                                                            ? new Date(dream.createdAt).toLocaleDateString('ar-SA')
                                                            : '—'}
                                                    </span>
                                                    {dream.status === 'completed' && dream.rating && (
                                                        <span className="flex items-center gap-1 text-amber-400">
                                                            <Star size={14} className="fill-amber-400" />
                                                            {dream.rating.score}/5
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-left">
                                                <div className="text-lg font-bold text-[var(--color-primary)]">
                                                    ${dream.price}
                                                </div>
                                            </div>
                                        </div>

                                        {dream.status === 'completed' && !dream.rating && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <span className="text-sm text-amber-400 group-hover:underline">
                                                    قيّم التفسير ⭐
                                                </span>
                                            </div>
                                        )}

                                        {dream.status === 'completed' && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <span className="text-sm text-[var(--color-primary)] group-hover:underline">
                                                    عرض التفسير ←
                                                </span>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
