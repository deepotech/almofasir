'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function DreamForm() {
    const { user, isGuest } = useAuth();
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [mood, setMood] = useState('neutral');
    const [loading, setLoading] = useState(false);

    const moods = [
        { id: 'happy', label: 'فرح', emoji: '😊' },
        { id: 'anxious', label: 'قلق', emoji: '😰' },
        { id: 'sad', label: 'حزن', emoji: '😢' },
        { id: 'confused', label: 'حيرة', emoji: '🤔' },
        { id: 'neutral', label: 'محايد', emoji: '😐' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/dreams/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    date,
                    mood,
                    userId: user?.uid,
                    isGuest
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'LIMIT_REACHED') {
                    toast.error('لقد تجاوزت الحد المسموح من التفسيرات المجانية.');
                    // Trigger Paywall Modal here
                } else {
                    throw new Error(data.error);
                }
            } else {
                toast.success('تم تسجيل الحلم وتفسيره بنجاح!');
                setContent('');
                // Redirect or update stats
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء تسجيل الحلم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-lg relative overflow-hidden group"
        >
            {/* Glassmorphism decorative blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl -z-10 group-hover:bg-[var(--color-primary)]/20 transition-all duration-700"></div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-3xl">🌙</span>
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">تسجيل حلم جديد</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                        ماذا رأيت في حلمك؟
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        placeholder="سرد تفاصيل الحلم..."
                        className="w-full h-40 bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl p-4 text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                            تاريخ الحلم
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                            الشعور السائد
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {moods.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMood(m.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${mood === m.id
                                        ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'bg-[var(--color-bg-primary)]/30 border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
                                        }`}
                                >
                                    <span>{m.emoji}</span>
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري التفسير...' : 'تفسير الحلم'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
