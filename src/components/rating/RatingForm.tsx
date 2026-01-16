'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Send, Loader2 } from 'lucide-react';
import StarRating from './StarRating';

interface RatingFormProps {
    orderId: string;
    apiEndpoint?: string; // Custom endpoint, defaults to /api/orders/[orderId]/rate
    existingRating?: number;
    existingFeedback?: string;
    onRatingSubmitted?: (rating: number) => void;
    getToken: () => Promise<string>;
}

const FEEDBACK_QUESTIONS = [
    { id: 'clarity', label: 'هل كان التفسير واضحًا؟', options: ['نعم', 'إلى حد ما', 'لا'] },
    { id: 'helpful', label: 'هل استفدت من التفسير؟', options: ['نعم', 'إلى حد ما', 'لا'] },
];

export default function RatingForm({
    orderId,
    apiEndpoint,
    existingRating,
    existingFeedback,
    onRatingSubmitted,
    getToken
}: RatingFormProps) {
    const [rating, setRating] = useState(existingRating || 0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(!!existingRating);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        setError('');

        try {
            const token = await getToken();
            const endpoint = apiEndpoint || `/api/orders/${orderId}/rate`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    feedback: comment,
                    answers
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'فشل إرسال التقييم');
            }

            setIsSubmitted(true);
            onRatingSubmitted?.(rating);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Already rated - show read-only view
    if (isSubmitted && existingRating) {
        return (
            <div className="glass-card p-6 text-center border-amber-500/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <CheckCircle className="text-emerald-400" size={20} />
                    <span className="text-emerald-400 font-medium">تم تقييم هذا التفسير</span>
                </div>
                <StarRating rating={existingRating} readonly size="lg" />
                {existingFeedback && (
                    <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
                        "{existingFeedback}"
                    </p>
                )}
            </div>
        );
    }

    // Just submitted - show thank you
    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center border-emerald-500/20"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle className="text-emerald-400" size={32} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">شكراً لتقييمك!</h3>
                <p className="text-gray-400">رأيك يساعدنا على تحسين جودة التفاسير</p>
            </motion.div>
        );
    }

    return (
        <div className="glass-card p-6 border-[var(--color-primary)]/20">
            <h3 className="text-lg font-bold text-white mb-4 text-center">قيّم هذا التفسير</h3>

            {/* Star Rating */}
            <div className="flex justify-center mb-6">
                <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>

            {/* Optional Questions - show after rating selected */}
            <AnimatePresence>
                {rating > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 mb-6 overflow-hidden"
                    >
                        {FEEDBACK_QUESTIONS.map((q) => (
                            <div key={q.id} className="text-center">
                                <p className="text-gray-300 text-sm mb-2">{q.label}</p>
                                <div className="flex justify-center gap-2">
                                    {q.options.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: option }))}
                                            className={`px-4 py-1.5 rounded-full text-sm transition-all ${answers[q.id] === option
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Comment field */}
                        <div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                                placeholder="أضف تعليقًا (اختياري)..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-gray-500 resize-none focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                rows={2}
                            />
                            <p className="text-xs text-gray-500 text-left mt-1">{comment.length}/200</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${rating > 0
                    ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        جاري الإرسال...
                    </>
                ) : (
                    <>
                        <Send size={18} />
                        إرسال التقييم
                    </>
                )}
            </button>
        </div>
    );
}
