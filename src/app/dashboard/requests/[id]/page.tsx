'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import RatingForm from '@/components/rating/RatingForm';

export default function UserRequestDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchRequest = async () => {
        if (!user || !params.id) return;
        try {
            const token = await user.getIdToken();
            // Fetch from the NEW unified endpoint
            const res = await fetch(`/api/orders/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequest(data.request);
                setLastUpdated(new Date());
            } else {
                const errData = await res.json();
                setError(errData.error || 'فشل تحميل تفاصيل الحلم');
            }
        } catch (err) {
            console.error(err);
            setError('حدث خطأ أثناء الاتصال');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRequest();
        }
    }, [user, params.id]);

    // Polling logic: Update every 30 seconds if status is "in_progress" or "new"
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (request && (request.status === 'new' || request.status === 'in_progress')) {
            interval = setInterval(() => {
                fetchRequest();
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [request]);

    if (loading) return <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-gray-400">جاري التحميل...</div>;
    if (error) return <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-red-400">{error}</div>;
    if (!request) return <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-gray-400">لم يتم العثور على الطلب</div>;

    const isCompleted = ['completed', 'clarification_requested', 'closed'].includes(request.status);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] pt-32 pb-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft size={18} /> العودة للسجل
                    </button>
                    <button onClick={fetchRequest} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <RefreshCw size={12} /> تحديث {lastUpdated.toLocaleTimeString('ar-EG')}
                    </button>
                </div>

                {/* Status Header */}
                <div className="glass-card p-8 border-r-4 border-r-[var(--color-primary)]">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">تفسير حلمك بواسطة {request.interpreterName || 'المفسر'}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {isCompleted ? 'تم التفسير' : request.status === 'in_progress' ? 'جاري التفسير' : 'بانتظار المفسر'}
                                </span>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold border w-fit ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            request.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                            {isCompleted ? 'مكتمل' : request.status === 'in_progress' ? 'قيد التفسير' : 'قيد الانتظار'}
                        </span>
                    </div>
                </div>

                {/* Dream Content */}
                <div className="md:grid md:grid-cols-2 gap-6 space-y-6 md:space-y-0">
                    <div className="glass-card p-6 h-fit">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            نص الحلم
                        </h3>
                        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {request.dreamText}
                        </p>
                    </div>

                    {/* Interpretation */}
                    <div className={`glass-card p-6 border border-emerald-500/20 ${!isCompleted ? 'opacity-70' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            التفسير
                        </h3>

                        {isCompleted && request.interpretationText ? (
                            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap animate-fadeIn">
                                {request.interpretationText}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Clock size={48} className="mx-auto mb-4 opacity-30 animate-pulse" />
                                <p className="mb-2">المفسر يعمل على حلمك حالياً...</p>
                                <p className="text-sm opacity-60">سيتم تحديث الصفحة تلقائياً عند اكتمال التفسير</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rating Section - Only show for completed requests */}
                {request.status === 'completed' && request.interpretationText && (
                    <RatingForm
                        orderId={request._id}
                        existingRating={request.rating}
                        existingFeedback={request.feedback}
                        onRatingSubmitted={(rating) => setRequest((prev: any) => ({ ...prev, rating }))}
                        getToken={() => user!.getIdToken()}
                    />
                )}

                {/* Feedback Section (Only if completed) */}
                {isCompleted && (
                    <div className="text-center py-8">
                        {request.status === 'completed' && !request.clarificationQuestion && (
                            <button
                                onClick={() => router.push(`/dashboard/requests/${request._id}/clarification`)}
                                className="text-sm text-[var(--color-primary)] hover:text-white underline"
                            >
                                هل لديك استفسار حول التفسير؟ (مسموح بسؤال واحد)
                            </button>
                        )}
                        {request.clarificationQuestion && (
                            <div className="mt-4 glass-card p-4 text-right">
                                <h4 className="text-sm font-bold text-gold mb-2">سؤال التوضيح:</h4>
                                <p className="text-gray-300 text-sm mb-4">{request.clarificationQuestion}</p>
                                {request.clarificationAnswer ? (
                                    <>
                                        <h4 className="text-sm font-bold text-emerald-400 mb-2">رد المفسر:</h4>
                                        <p className="text-gray-300 text-sm">{request.clarificationAnswer}</p>
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-500">بانتظار رد المفسر...</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
