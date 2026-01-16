'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Calendar, User, Clock, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RequestDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<any>(null);
    const [interpretationText, setInterpretationText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            if (!user || !params.id) return;
            try {
                const token = await user.getIdToken();
                // Use the NEW unified endpoint
                const res = await fetch(`/api/dream-requests/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setRequest(data.request);
                    if (data.request.interpretationText) {
                        setInterpretationText(data.request.interpretationText);
                    }
                } else {
                    setError('فشل تحميل تفاصيل الحلم');
                }
            } catch (err) {
                console.error(err);
                setError('حدث خطأ أثناء الاتصال');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRequest();
        }
    }, [user, params.id]);

    const handleSubmit = async () => {
        if (!interpretationText.trim()) return;
        setSubmitting(true);
        try {
            const token = await user?.getIdToken();
            // Use NEW endpoint: /api/interpreter/dream-requests/[id]/interpret
            const res = await fetch(`/api/interpreter/dream-requests/${params.id}/interpret`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    interpretationText: interpretationText
                })
            });

            if (res.ok) {
                setSuccess(true);
                // Refresh request data to confirm status change
                const updated = await res.json();
                setRequest((prev: any) => ({ ...prev, status: 'completed', interpretationText }));
                setTimeout(() => router.push('/interpreter/dashboard'), 2000);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to submit');
            }
        } catch (err: any) {
            setError(err.message || 'فشل إرسال التفسير. حاول مرة أخرى.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStart = async () => {
        try {
            const token = await user?.getIdToken();
            // Use NEW endpoint: /api/interpreter/dream-requests/[id]/start
            const res = await fetch(`/api/interpreter/dream-requests/${params.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setRequest({ ...request, status: 'in_progress' });
            } else {
                console.error('Failed to start');
            }
        } catch (err) {
            console.error('Failed to start interpretation', err);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">جاري التحميل...</div>;
    if (!request) return <div className="p-12 text-center text-red-400">لم يتم العثور على الطلب</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
                <ArrowRight size={18} /> العودة للقائمة
            </button>

            {/* Dream Content Card */}
            <div className="glass-card p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">طلب تفسير حلم</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {request.price} SAR</span>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${request.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        request.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                        {request.status === 'completed' ? 'مكتمل' : request.status === 'in_progress' ? 'قيد التفسير' : 'جديد'}
                    </span>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/5 mb-6">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 block">نص الحلم:</h3>
                    <p className="text-lg leading-relaxed text-gray-100 whitespace-pre-wrap">
                        {request.dreamText}
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {/* Context display removed as it might differ in new model, putting basic info if needed */}
                </div>
            </div>

            {/* Action Area */}
            <div className="glass-card p-8">
                {(request.status === 'new' || request.status === 'pending') ? ( // Handle 'new' status
                    <div className="text-center py-8">
                        <User size={48} className="mx-auto text-[var(--color-primary)] mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">جاهز لتفسير هذا الحلم؟</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">عند البدء، سيتم إشعار المستخدم بأن الحلم قيد التفسير حالياً.</p>
                        <button
                            onClick={handleStart}
                            className="px-8 py-3 bg-[var(--color-primary)] hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20"
                        >
                            ابدأ التفسير الآن
                        </button>
                    </div>
                ) : request.status === 'in_progress' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-lg">التفسير:</label>
                            <span className="text-sm text-gray-400">اكتب تفسيراً واضحاً ومفصلاً</span>
                        </div>
                        <textarea
                            value={interpretationText}
                            onChange={(e) => setInterpretationText(e.target.value)}
                            rows={12}
                            className="w-full bg-[var(--color-bg-primary)] border border-white/10 rounded-xl p-4 text-gray-100 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600 leading-relaxed"
                            placeholder="اكتب التفسير هنا..."
                        ></textarea>
                        <div className={`text-left text-xs mt-1 ${interpretationText.length < 50 ? 'text-amber-500' : 'text-green-500'}`}>
                            {interpretationText.length}/50 حرف
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-6">
                            <button className="px-6 py-3 text-gray-400 hover:text-white transition-colors">
                                حفظ كمسودة
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !interpretationText.trim()}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                {submitting ? 'جاري الإرسال...' : (
                                    <>
                                        إرسال التفسير <Send size={18} className="rotate-180" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
                        <h3 className="text-2xl font-bold text-emerald-400 mb-2">تم تفسير هذا الحلم</h3>
                        <p className="text-gray-400">تم إرسال التفسير للمستخدم بنجاح.</p>

                        {/* Clarification Section */}
                        {request.clarificationQuestion && (
                            <div className="mt-8 pt-8 border-t border-white/10 text-right">
                                <h4 className="text-lg font-bold mb-4 text-amber-400">سؤال توضيحي من المستخدم:</h4>
                                <p className="bg-white/5 p-4 rounded-xl mb-6">{request.clarificationQuestion}</p>

                                {request.clarificationAnswer ? (
                                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <h5 className="font-bold text-emerald-400 mb-2">إجابتك:</h5>
                                        <p>{request.clarificationAnswer}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-4">يمكنك الرد على سؤال المستخدم الآن</p>
                                        <button
                                            onClick={() => router.push(`/interpreter/dashboard/requests/${request._id}/clarification`)}
                                            className="btn btn-primary"
                                        >
                                            الرد على السؤال
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
