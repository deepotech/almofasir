'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClarificationPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<any>(null);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || !params.id) return;

        const fetchRequest = async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/dream-requests/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setRequest(data.request);
                    // Verify if clarification is allowed
                    if (data.request.clarificationQuestion) {
                        router.replace(`/dashboard/requests/${params.id}`);
                    }
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

        fetchRequest();
    }, [user, params.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/dream-requests/${params.id}/clarification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question })
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/dashboard/requests/${params.id}`);
            } else {
                setError(data.error || 'فشل إرسال السؤال');
            }
        } catch (err) {
            setError('حدث خطأ أثناء الإرسال');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-gray-400">جاري التحميل...</div>;
    if (error && !request) return <div className="min-h-screen pt-24 pb-12 flex items-center justify-center text-red-400">{error}</div>;

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] pt-32 pb-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors mb-6">
                    <ArrowLeft size={18} /> إلغاء وعودة
                </button>

                <div className="glass-card p-8 border-t-4 border-t-[var(--color-primary)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">استفسار حول التفسير</h1>
                            <p className="text-gray-400 text-sm">يمكنك طرح سؤال واحد فقط للتوضيح حول التفسير الذي حصلت عليه</p>
                        </div>
                    </div>

                    {/* Context Preview */}
                    <div className="bg-white/5 rounded-xl p-4 mb-8">
                        <h3 className="text-xs font-bold text-gray-500 mb-2">ملخص الحلم:</h3>
                        <p className="text-gray-300 text-sm line-clamp-2">{request?.dreamText}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">سؤالك للمفسر</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full bg-[var(--color-bg-secondary)] border border-gray-700 rounded-xl p-4 text-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all h-40 resize-none"
                                placeholder="اكتب استفسارك هنا بوضوح..."
                                maxLength={500}
                                required
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>يجب أن يكون السؤال واضحاً ومختصراً</span>
                                <span>{question.length}/500</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !question.trim()}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                'جاري الإرسال...'
                            ) : (
                                <>
                                    <span>إرسال الاستفسار</span>
                                    <Send size={18} className="rtl:rotate-180" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
