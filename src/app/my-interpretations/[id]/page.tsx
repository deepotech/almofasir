'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowRight, Clock, User, Star, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';

interface HumanDream {
    _id: string;
    interpreterName: string;
    content: string;
    context: {
        gender?: string;
        socialStatus?: string;
    };
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

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function InterpretationDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [dream, setDream] = useState<HumanDream | null>(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        if (user) fetchDream();
    }, [user, id]);

    const fetchDream = async () => {
        try {
            const token = await user!.getIdToken();
            // Updated to use unified /api/orders endpoint
            const res = await fetch(`/api/orders/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map order to HumanDream interface
                const order = data.order;
                const mappedDream = {
                    _id: order._id,
                    interpreterName: order.interpreterName || 'مفسر',
                    content: order.dreamText,
                    context: order.context || {},
                    interpretation: order.interpretationText,
                    price: order.price || 0,
                    status: order.status,
                    deadline: order.deadline,
                    rating: order.rating ? { score: order.rating, comment: order.feedback } : undefined,
                    createdAt: order.createdAt,
                    completedAt: order.completedAt
                };
                setDream(mappedDream);
                if (mappedDream.rating) {
                    setRating(mappedDream.rating.score);
                    setComment(mappedDream.rating.comment || '');
                }
            } else {
                router.push('/my-interpretations');
            }
        } catch (error) {
            console.error('Error fetching dream:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            alert('يرجى اختيار تقييم');
            return;
        }

        setSubmittingRating(true);
        try {
            const token = await user!.getIdToken();
            // Updated to use unified /api/orders/[id]/rate endpoint
            const res = await fetch(`/api/orders/${id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, feedback: comment })
            });

            if (res.ok) {
                const data = await res.json();
                // Update dream with new rating
                fetchDream(); // Refresh to get updated data
                alert('شكراً لتقييمك!');
            } else {
                const data = await res.json();
                alert(data.error || 'حدث خطأ');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('حدث خطأ');
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const statuses: Record<string, { text: string; class: string; icon: React.ReactNode }> = {
            'pending_interpretation': {
                text: 'في انتظار التفسير',
                class: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                icon: <Clock size={18} />
            },
            'in_progress': {
                text: 'جاري التفسير',
                class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: <MessageSquare size={18} />
            },
            'completed': {
                text: 'مكتمل',
                class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: <CheckCircle size={18} />
            },
            'disputed': {
                text: 'قيد المراجعة',
                class: 'bg-red-500/10 text-red-400 border-red-500/20',
                icon: <AlertTriangle size={18} />
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

    if (!dream) return null;

    const statusInfo = getStatusInfo(dream.status);
    const isCompleted = dream.status === 'completed';
    const hasRated = !!dream.rating;

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-white">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12" style={{ marginTop: 100 }}>
                <div className="max-w-3xl mx-auto">
                    {/* Back Link */}
                    <Link href="/my-interpretations" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                        <ArrowRight size={20} />
                        العودة للقائمة
                    </Link>

                    {/* Status Header */}
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 ${statusInfo.class}`}>
                        {statusInfo.icon}
                        <span className="font-bold">{statusInfo.text}</span>
                        <span className="text-sm opacity-70">• المفسر: {dream.interpreterName}</span>
                    </div>

                    {/* Dream Content */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User size={20} className="text-[var(--color-primary)]" />
                            حلمك
                        </h2>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {dream.content}
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-500">
                            تاريخ الإرسال: {new Date(dream.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                    </div>

                    {/* Interpretation */}
                    {isCompleted && dream.interpretation ? (
                        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                <CheckCircle size={20} />
                                التفسير
                            </h2>
                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                {dream.interpretation}
                            </p>
                            <div className="mt-4 pt-4 border-t border-emerald-500/20 text-sm text-gray-400">
                                تم التفسير بتاريخ: {dream.completedAt ? new Date(dream.completedAt).toLocaleDateString('ar-SA') : '-'}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-6">
                            <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold mb-2">في انتظار التفسير</h3>
                            <p className="text-gray-400">
                                سيقوم المفسر بمراجعة حلمك وإرسال التفسير قريباً
                            </p>
                        </div>
                    )}

                    {/* Rating Section */}
                    {isCompleted && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Star size={20} className="text-amber-400" />
                                {hasRated ? 'تقييمك' : 'قيّم التفسير'}
                            </h2>

                            {/* Star Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => !hasRated && setRating(star)}
                                        disabled={hasRated}
                                        className={`transition-all ${hasRated ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                                    >
                                        <Star
                                            size={32}
                                            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <span className="mr-2 text-gray-400">({rating}/5)</span>
                                )}
                            </div>

                            {/* Comment */}
                            {!hasRated && (
                                <>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="تعليق (اختياري)"
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-[var(--color-primary)] focus:outline-none resize-none mb-4"
                                    />
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={rating === 0 || submittingRating}
                                        className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingRating ? 'جاري الإرسال...' : 'إرسال التقييم'}
                                    </button>
                                </>
                            )}

                            {hasRated && dream.rating?.comment && (
                                <p className="text-gray-400 italic">"{dream.rating.comment}"</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
