'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, Clock, User, Send, Sparkles, AlertTriangle } from 'lucide-react';

interface HumanDream {
    _id: string;
    content: string;
    context: {
        gender?: string;
        socialStatus?: string;
        ageRange?: string;
        dominantFeeling?: string;
        isRecurring?: boolean;
    };
    price: number;
    interpreterEarning: number;
    status: string;
    deadline: string;
    interpretation?: string;
    aiSuggestion?: string;
    createdAt: string;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function InterpretDreamPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [dream, setDream] = useState<HumanDream | null>(null);
    const [loading, setLoading] = useState(true);
    const [interpretation, setInterpretation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showAiSuggestion, setShowAiSuggestion] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);

    useEffect(() => {
        if (user) fetchDream();
    }, [user, id]);

    const fetchDream = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/interpreter/dreams/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDream(data.dream);
                if (data.dream.interpretation) {
                    setInterpretation(data.dream.interpretation);
                }
            } else {
                router.push('/interpreter/dashboard/dreams');
            }
        } catch (error) {
            console.error('Error fetching dream:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInterpretation = async () => {
        if (!dream || dream.status !== 'pending_interpretation') return;

        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/interpreter/dreams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'start' })
            });
            if (res.ok) {
                const data = await res.json();
                setDream(data.dream);
            }
        } catch (error) {
            console.error('Error starting interpretation:', error);
        }
    };

    const handleSubmit = async () => {
        if (!interpretation.trim() || interpretation.length < 50) {
            alert('التفسير قصير جداً، يجب أن يكون 50 حرفاً على الأقل');
            return;
        }

        setSubmitting(true);
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/interpreter/dreams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'submit', interpretation })
            });

            if (res.ok) {
                router.push('/interpreter/dashboard/dreams?success=true');
            } else {
                const data = await res.json();
                alert(data.error || 'حدث خطأ');
            }
        } catch (error) {
            console.error('Error submitting interpretation:', error);
            alert('حدث خطأ أثناء إرسال التفسير');
        } finally {
            setSubmitting(false);
        }
    };

    const generateAiSuggestion = async () => {
        setGeneratingAi(true);
        try {
            // Call AI API for suggestion
            const res = await fetch('/api/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dream: dream?.content,
                    interpreter: 'ibn-sirin',
                    context: dream?.context
                })
            });

            if (res.ok) {
                const data = await res.json();
                setDream(prev => prev ? { ...prev, aiSuggestion: data.interpretation?.summary } : null);
                setShowAiSuggestion(true);
            }
        } catch (error) {
            console.error('Error generating AI suggestion:', error);
        } finally {
            setGeneratingAi(false);
        }
    };

    const getContextLabel = (key: string, value: string) => {
        const labels: Record<string, Record<string, string>> = {
            gender: { male: 'ذكر', female: 'أنثى' },
            socialStatus: { single: 'أعزب', married: 'متزوج', divorced: 'مطلق', widowed: 'أرمل' },
            ageRange: { child: 'طفل', teen: 'مراهق', adult: 'بالغ', elderly: 'كبير' }
        };
        return labels[key]?.[value] || value;
    };

    const getTimeRemaining = () => {
        if (!dream) return null;
        const now = new Date();
        const deadline = new Date(dream.deadline);
        const diff = deadline.getTime() - now.getTime();

        if (diff < 0) return { text: 'متأخر!', urgent: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            text: hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`,
            urgent: hours < 3
        };
    };

    if (loading) {
        return (
            <div className="animate-fadeIn space-y-6">
                <div className="h-8 bg-white/5 rounded w-32 animate-pulse"></div>
                <div className="h-64 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="h-48 bg-white/5 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (!dream) return null;

    const timeRemaining = getTimeRemaining();
    const isCompleted = dream.status === 'completed';
    const canEdit = dream.status === 'in_progress';

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl">
            {/* Back Link */}
            <Link href="/interpreter/dashboard/dreams" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowRight size={20} />
                العودة للقائمة
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">تفسير الحلم</h1>
                {!isCompleted && timeRemaining && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeRemaining.urgent ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                        {timeRemaining.urgent && <AlertTriangle size={18} />}
                        <Clock size={18} />
                        <span>متبقي: {timeRemaining.text}</span>
                    </div>
                )}
            </div>

            {/* Dream Content */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <User size={20} className="text-[var(--color-primary)]" />
                    نص الحلم
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {dream.content}
                </p>

                {/* Context */}
                {dream.context && Object.keys(dream.context).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">معلومات الرائي</h3>
                        <div className="flex flex-wrap gap-2">
                            {dream.context.gender && (
                                <span className="px-3 py-1 bg-white/5 rounded-full text-sm">
                                    {getContextLabel('gender', dream.context.gender)}
                                </span>
                            )}
                            {dream.context.socialStatus && (
                                <span className="px-3 py-1 bg-white/5 rounded-full text-sm">
                                    {getContextLabel('socialStatus', dream.context.socialStatus)}
                                </span>
                            )}
                            {dream.context.ageRange && (
                                <span className="px-3 py-1 bg-white/5 rounded-full text-sm">
                                    {getContextLabel('ageRange', dream.context.ageRange)}
                                </span>
                            )}
                            {dream.context.dominantFeeling && (
                                <span className="px-3 py-1 bg-white/5 rounded-full text-sm">
                                    الشعور: {dream.context.dominantFeeling}
                                </span>
                            )}
                            {dream.context.isRecurring && (
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm">
                                    حلم متكرر
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Start Button (if pending) */}
            {dream.status === 'pending_interpretation' && (
                <button
                    onClick={handleStartInterpretation}
                    className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-amber-500 text-black font-bold rounded-xl hover:scale-[1.01] transition-all"
                >
                    بدء التفسير
                </button>
            )}

            {/* Interpretation Section */}
            {(canEdit || isCompleted) && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">التفسير</h2>
                        {canEdit && !dream.aiSuggestion && (
                            <button
                                onClick={generateAiSuggestion}
                                disabled={generatingAi}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors text-sm"
                            >
                                <Sparkles size={16} />
                                {generatingAi ? 'جاري التوليد...' : 'اقتراح AI'}
                            </button>
                        )}
                    </div>

                    {/* AI Suggestion */}
                    {showAiSuggestion && dream.aiSuggestion && (
                        <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold mb-2">
                                <Sparkles size={16} />
                                اقتراح الذكاء الاصطناعي
                            </div>
                            <p className="text-gray-300 text-sm">{dream.aiSuggestion}</p>
                            <button
                                onClick={() => setInterpretation(dream.aiSuggestion || '')}
                                className="mt-2 text-xs text-indigo-400 hover:underline"
                            >
                                استخدام هذا النص كقاعدة
                            </button>
                        </div>
                    )}

                    <textarea
                        value={interpretation}
                        onChange={(e) => setInterpretation(e.target.value)}
                        disabled={isCompleted}
                        placeholder="اكتب تفسيرك هنا..."
                        className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-[var(--color-primary)] focus:outline-none resize-none disabled:opacity-60"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {interpretation.length} حرف (الحد الأدنى: 50)
                    </p>

                    {canEdit && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || interpretation.length < 50}
                            className="mt-4 w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send size={20} />
                            {submitting ? 'جاري الإرسال...' : 'إرسال التفسير'}
                        </button>
                    )}
                </div>
            )}

            {/* Earnings Info */}
            <div className="glass-card p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">أرباحك من هذا التفسير</p>
                        <p className="text-2xl font-bold text-emerald-400">${dream.interpreterEarning.toFixed(2)}</p>
                    </div>
                    <div className="text-left text-sm text-gray-500">
                        <p>السعر الكلي: ${dream.price}</p>
                        <p>عمولة المنصة: ${(dream.price - dream.interpreterEarning).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
