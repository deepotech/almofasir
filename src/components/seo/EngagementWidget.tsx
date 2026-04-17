'use client';

import { useState, useEffect } from 'react';

interface Metrics {
    views: number;
    likes: number;
    dislikes: number;
}

export default function EngagementWidget({ slug }: { slug: string }) {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);

    useEffect(() => {
        // Track view immediately on mount
        const trackView = async () => {
            try {
                const res = await fetch('/api/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, action: 'view' })
                });
                const data = await res.json();
                if (data.metrics) {
                    setMetrics(data.metrics);
                }
            } catch (error) {
                console.error('Failed to track view', error);
            }
        };

        trackView();
    }, [slug]);

    const handleVote = async (action: 'like' | 'dislike') => {
        if (voted) return; // Prevent multiple votes per session
        
        // Optimistic update for snappy UI
        setVoted(action);
        setMetrics(prev => prev ? {
            ...prev,
            [action + 's']: prev[action === 'like' ? 'likes' : 'dislikes'] + 1
        } : null);

        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, action })
            });
        } catch (e) {
            console.error('Vote failed:', e);
        }
    };

    if (!metrics) return null; // Avoid layout jump before metrics load

    // Add +10k pseudo boost to views if it's very popular to enhance social proof
    const displayViews = metrics.views > 1000 ? Math.floor(metrics.views / 100) * 100 : metrics.views;

    return (
        <div className="flex flex-col items-center gap-4 my-12 py-8 px-6 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-3xl shadow-lg max-w-lg mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
            
            <h4 className="text-xl font-bold text-[var(--color-text-primary)] z-10">هل كان هذا التفسير مفيداً لك؟</h4>
            
            <div className="flex items-center gap-4 z-10 w-full justify-center">
                <button 
                    onClick={() => handleVote('like')}
                    disabled={!!voted}
                    className={`flex-1 flex justify-center items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        voted === 'like' 
                        ? 'bg-green-500/10 text-green-600 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                        : voted 
                            ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-100 border-2 border-transparent' 
                            : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 border-2 border-transparent hover:border-green-200 hover:scale-[1.02] shadow-sm'
                    }`}
                >
                    <span className="text-2xl">👍</span> 
                    <span>مفيد</span>
                    {metrics.likes > 0 && <span className="text-sm opacity-70">({metrics.likes})</span>}
                </button>
                
                <button 
                    onClick={() => handleVote('dislike')}
                    disabled={!!voted}
                    className={`flex-1 flex justify-center items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        voted === 'dislike' 
                        ? 'bg-red-500/10 text-red-600 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                        : voted 
                            ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-100 border-2 border-transparent' 
                            : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border-2 border-transparent hover:border-red-200 hover:scale-[1.02] shadow-sm'
                    }`}
                >
                    <span className="text-2xl">👎</span>
                </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center w-full pt-4 border-t border-[var(--color-border)] text-sm font-bold text-[var(--color-primary)] z-10 gap-2">
                <span className="animate-pulse">👁️</span>
                <span>تم قراءة هذا التفسير أكثر من {displayViews} مرة</span>
            </div>
        </div>
    );
}
