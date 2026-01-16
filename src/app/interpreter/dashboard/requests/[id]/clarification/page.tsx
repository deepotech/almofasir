'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClarificationPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            if (!user || !params.id) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/dream-requests/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setRequest(data.request);
                } else {
                    setError('فشل تحميل تفاصيل الطلب');
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
        if (!answer.trim()) return;
        if (answer.length < 20) {
            setError('يجب أن تكون الإجابة 20 حرفاً على الأقل');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/interpreter/dream-requests/${params.id}/clarification-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answer: answer
                })
            });

            if (res.ok) {
                // Success - Redirect back to request detail
                router.push(`/interpreter/dashboard/requests/${params.id}`);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'فشل إرسال الإجابة');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">جاري التحميل...</div>;
    if (!request) return <div className="p-12 text-center text-red-400">لم يتم العثور على الطلب</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
                <ArrowRight size={18} /> العودة للتفاصيل
            </button>

            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="text-[var(--color-primary)]" size={24} />
                    <h2 className="text-2xl font-bold">الرد على استفسار المستخدم</h2>
                </div>

                {/* Original Dream Context */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6 opacity-60">
                    <h3 className="text-xs font-bold text-gray-400 mb-2">الحلم الأصلي:</h3>
                    <p className="text-sm line-clamp-3">{request.dreamText}</p>
                </div>

                {/* User's Question */}
                <div className="bg-[var(--color-bg-tertiary)]/50 p-6 rounded-xl border border-[var(--color-border)] mb-8">
                    <h3 className="text-sm font-bold text-amber-400 mb-3">سؤال المستخدم:</h3>
                    <p className="text-lg font-medium leading-relaxed">{request.clarificationQuestion}</p>
                </div>

                {/* Answer Input */}
                <div className="space-y-4">
                    <label className="block font-bold text-gray-200">إجابتك:</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={6}
                        className="w-full bg-[var(--color-bg-primary)] border border-white/10 rounded-xl p-4 text-gray-100 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-600 leading-relaxed"
                        placeholder="اكتب ردك على استفسار المستخدم هنا..."
                    ></textarea>

                    <div className={`text-left text-xs mt-1 ${answer.length < 20 ? 'text-amber-500' : 'text-green-500'}`}>
                        {answer.length}/20 حرف
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !answer.trim() || answer.length < 20}
                            className="px-8 py-3 bg-[var(--color-primary)] hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
                        >
                            {submitting ? 'جاري الإرسال...' : (
                                <>
                                    إرسال الرد <Send size={18} className="rotate-180" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
