'use client';

import { Star, EyeOff, AlertOctagon } from 'lucide-react';

export default function AdminReviewsPage() {
    // Mock Reviews
    const reviews = [
        { id: 1, user: 'User99', interpreter: 'أحمد محمد', rating: 1, comment: 'تفسير سطحي جداً ولم يجب على سؤالي.', date: '2025-01-08' },
        { id: 2, user: 'Sarah', interpreter: 'منى يوسف', rating: 2, comment: 'تأخرت كثيراً في الرد.', date: '2025-01-07' },
        { id: 3, user: 'Ali', interpreter: 'سارة علي', rating: 5, comment: 'ممتاز جداً شكراً لك.', date: '2025-01-08' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">مراقبة الجودة والتقييمات</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold border border-red-500/20">
                        التقييمات المنخفضة فقط
                    </button>
                    <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10">
                        الكل
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-white">{review.user}</span>
                                <span className="text-gray-500 text-sm">يقيّم المفسر</span>
                                <span className="text-[var(--color-primary-light)] font-bold">{review.interpreter}</span>
                            </div>
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={`${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                                "{review.comment}"
                            </p>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-r border-white/5 pt-4 md:pt-0 md:pr-4">
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-colors w-full justify-center">
                                <EyeOff size={14} /> إخفاء التقييم
                            </button>
                            {review.rating <= 2 && (
                                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors w-full justify-center">
                                    <AlertOctagon size={14} /> توجيه إنذار
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
