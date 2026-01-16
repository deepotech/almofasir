'use client';

import { Star, MessageCircle, ThumbsUp } from 'lucide-react';

export default function ReviewsPage() {
    // Mock Reviews Data
    const reviews = [
        { id: 1, user: 'أمل العلي', rating: 5, date: '2025-01-08', content: 'تفسير دقيق ومريح للنفس، شكراً جزيلاً لك يا شيخ.', useful: 12 },
        { id: 2, user: 'محمد س.', rating: 5, date: '2025-01-07', content: 'ما شاء الله تبارك الله، أسلوب راقي وسرعة في الرد.', useful: 8 },
        { id: 3, user: 'نورة', rating: 4, date: '2025-01-06', content: 'التفسير واضح ولكن تمنيت تفاصيل أكثر عن الرمز الثاني.', useful: 3 },
        { id: 4, user: 'عبدالله', rating: 5, date: '2025-01-05', content: 'جزاك الله خيراً، وقع التفسير كما ذكرت.', useful: 15 },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold mb-2">التقييمات وآراء المستخدمين</h1>
                <p className="text-gray-400">آراء المستفيدين هي وقود استمرارك ونجاحك</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-8 flex items-center justify-between bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                    <div>
                        <p className="text-purple-300 text-sm font-bold mb-1 uppercase tracking-wider">متوسط التقييم العام</p>
                        <div className="flex items-end gap-2">
                            <h2 className="text-5xl font-bold text-white">4.8</h2>
                            <span className="text-gray-400 text-lg mb-1">/ 5.0</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={20} className={`${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} drop-shadow-lg`} />
                            ))}
                        </div>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Star size={40} className="text-purple-400" />
                    </div>
                </div>

                <div className="glass-card p-8 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm font-bold mb-1 uppercase tracking-wider">إجمالي التقييمات</p>
                        <h2 className="text-5xl font-bold">142</h2>
                        <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                            <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/20">+12 هذا الأسبوع</span>
                        </p>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <MessageCircle size={40} className="text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                <h3 className="font-bold text-xl px-2">آخر التعليقات</h3>
                {reviews.map((review) => (
                    <div key={review.id} className="glass-card p-6 hover:border-[var(--color-primary)]/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm text-[var(--color-primary-light)]">
                                    {review.user.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{review.user}</h4>
                                    <div className="flex gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={`${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{review.date}</span>
                        </div>

                        <p className="text-gray-300 leading-relaxed mb-4 text-sm">
                            "{review.content}"
                        </p>

                        <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <ThumbsUp size={12} /> {review.useful} وجدوا هذا مفيداً
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
