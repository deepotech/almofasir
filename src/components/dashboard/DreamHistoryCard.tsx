
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Dream {
    _id: string;
    content: string;
    date: string;
    mood: string;
    keywords: string[];
    interpretation?: {
        summary: string;
        aiGenerated?: boolean;
        humanResponse?: string;
    };
    humanReviewStatus?: 'none' | 'pending' | 'completed';
    type?: 'ai' | 'human';
    status?: string;
    interpreter?: string;
}

interface Props {
    dream: Dream;
    onRequestReview?: (id: string) => void; // Optional now as we navigate to details
    isRequesting?: boolean;
}

export default function DreamHistoryCard({ dream }: Props) {
    // Format date in Arabic
    const formattedDate = new Date(dream.date).toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short'
    });

    // Helper to get truncated content
    const truncate = (text: string, length: number) => {
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-bg-card)] rounded-[2rem] p-6 border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 flex flex-col h-full min-h-[320px] relative group"
        >
            {/* Header: Date & Badges */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    {/* Sentiment Emoji */}
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl border border-[var(--color-border)]" title={dream.mood}>
                        {dream.mood === 'happy' ? '😊' : dream.mood === 'sad' ? '😢' : dream.mood === 'anxious' ? '😰' : '😐'}
                    </div>

                    {/* Interpreter Badge */}
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-lg border border-[var(--color-primary)]/20" title="AI Interpreter">
                        <span className="text-xs font-bold text-[var(--color-primary)]">AI</span>
                    </div>
                    {dream.interpretation?.humanResponse && (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-lg border border-[var(--color-accent)]/20" title="تفسير بشري">
                            <span className="text-xs font-bold text-[var(--color-accent)]">👑</span>
                        </div>
                    )}
                </div>

                <span className="text-[var(--color-text-muted)] text-sm font-medium bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                    {formattedDate}
                </span>
            </div>

            {/* Content Body */}
            <div className="flex-grow mb-6 text-center">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 line-clamp-1">
                    {truncate(dream.content, 25)}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 line-clamp-3">
                    {truncate(dream.content, 120)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {dream.keywords?.slice(0, 3).map((k, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-[var(--color-bg-tertiary)] rounded-lg text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] transition-colors">
                            #{k}
                        </span>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-[var(--color-border)]/50">
                <div className="flex items-center justify-between mb-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        {dream.type === 'human' ? (
                            <span className={`px-2.5 py-1 rounded text-xs font-medium border ${dream.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                dream.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                {dream.status === 'completed' ? 'مكتمل' :
                                    dream.status === 'in_progress' ? 'قيد التفسير' :
                                        'قيد الانتظار'}
                            </span>
                        ) : (
                            <span className={`px-2.5 py-1 rounded text-xs font-medium ${dream.humanReviewStatus === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                مكتمل
                            </span>
                        )}
                    </div>

                    {/* Interpreter Name */}
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs">
                        <span>{dream.interpreter || 'ibn-sirin'}</span>
                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                </div>

                <Link
                    href={dream.type === 'human' ? `/dashboard/requests/${dream._id}` : `/dashboard/dream/${dream._id}`}
                    className="flex w-full items-center justify-center py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/30 transition-all duration-300 text-sm font-medium group-hover:bg-[var(--color-primary)]/5"
                >
                    عرض التفاصيل
                </Link>
            </div>
        </motion.div>
    );
}
