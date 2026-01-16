'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Dream {
    _id: string;
    title: string;
    content: string;
    mood: string;
    date: string;
    tags?: string[];
    interpretation?: {
        summary: string;
    };
}

export default function JournalPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [isLoadingDreams, setIsLoadingDreams] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newDream, setNewDream] = useState({
        title: '',
        content: '',
        mood: 'neutral'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        } else if (user) {
            fetchDreams();
        }
    }, [user, loading, router]);

    const fetchDreams = async () => {
        try {
            if (!user) return;

            const token = await user.getIdToken();
            const response = await fetch('/api/dreams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDreams(data.dreams);
            }
        } catch (error) {
            console.error('Error fetching dreams:', error);
        } finally {
            setIsLoadingDreams(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/dreams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newDream)
            });

            if (response.ok) {
                setShowAddModal(false);
                setNewDream({ title: '', content: '', mood: 'neutral' });
                fetchDreams(); // Refresh list
            }
        } catch (error) {
            console.error('Error creating dream:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-20">جاري التحميل...</div>;
    if (!user) return null; // Redirecting

    return (
        <>
            <Header />
            <main className="min-h-screen" style={{ paddingTop: 100 }}>
                <div className="container py-xl">
                    <div className="flex justify-between items-center mb-xl">
                        <h1 className="text-3xl font-bold">📖 سجل أحلامي</h1>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                        >
                            + أضف حلماً جديداً
                        </button>
                    </div>

                    {isLoadingDreams ? (
                        <div className="text-center py-20 text-[var(--color-text-muted)]">جاري تحميل أحلامك...</div>
                    ) : dreams.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-bg-secondary)]">
                            <div className="text-5xl mb-4">🌙</div>
                            <h2 className="text-xl font-bold mb-2">مفكرتك فارغة</h2>
                            <p className="text-[var(--color-text-muted)] mb-6">
                                لم تقم بتسجيل أي أحلام بعد. ابدأ بتدوين رؤياك الآن!
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-secondary"
                            >
                                سجل أول حلم
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dreams.map((dream) => (
                                <div key={dream._id} className="glass-card hover:transform hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-sm text-[var(--color-text-muted)]">
                                            {new Date(dream.date).toLocaleDateString('ar-SA')}
                                        </span>
                                        <span className="text-2xl" title={dream.mood}>
                                            {dream.mood === 'happy' ? '😊' :
                                                dream.mood === 'sad' ? '😔' :
                                                    dream.mood === 'anxious' ? '😰' :
                                                        dream.mood === 'confused' ? '😕' : '😐'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{dream.title}</h3>
                                    <p className="text-[var(--color-text-muted)] line-clamp-3 mb-4">
                                        {dream.content}
                                    </p>
                                    {dream.interpretation && (
                                        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg text-sm mb-4">
                                            <span className="text-[var(--color-secondary)]">🔮 التفسير: </span>
                                            {dream.interpretation.summary}
                                        </div>
                                    )}
                                    {dream.tags && dream.tags.length > 0 && (
                                        <div className="dream-tags mb-4">
                                            {dream.tags.map((tag, idx) => (
                                                <span key={idx} className="dream-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => router.push(`/dashboard/dream/${dream._id}`)}
                                            className="text-[var(--color-primary)] text-sm font-medium hover:underline"
                                        >
                                            عرض التفاصيل ←
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Dream Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowAddModal(false)}
                            />
                            <div className="relative w-full max-w-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fadeIn">
                                <div className="p-6 border-b border-[var(--color-border)]">
                                    <h2 className="text-2xl font-bold">تسجيل حلم جديد</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">عنوان الحلم</label>
                                        <input
                                            type="text"
                                            value={newDream.title}
                                            onChange={(e) => setNewDream({ ...newDream, title: e.target.value })}
                                            className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] outline-none"
                                            placeholder="مثال: رؤية المطر في الصيف"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">تفاصيل الحلم *</label>
                                        <textarea
                                            value={newDream.content}
                                            onChange={(e) => setNewDream({ ...newDream, content: e.target.value })}
                                            required
                                            rows={5}
                                            className="w-full p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] outline-none resize-none"
                                            placeholder="سرد ما رأيت بالتفصيل..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">الشعور المصاحب</label>
                                        <div className="flex gap-2">
                                            {[
                                                { val: 'happy', icon: '😊', label: 'سعيد' },
                                                { val: 'neutral', icon: '😐', label: 'عادي' },
                                                { val: 'anxious', icon: '😰', label: 'قلق' },
                                                { val: 'sad', icon: '😔', label: 'حزين' },
                                                { val: 'confused', icon: '😕', label: 'مرتبك' },
                                            ].map((m) => (
                                                <button
                                                    key={m.val}
                                                    type="button"
                                                    onClick={() => setNewDream({ ...newDream, mood: m.val })}
                                                    className={`flex-1 p-2 rounded-lg border transition-all ${newDream.mood === m.val
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                        : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                                                        }`}
                                                >
                                                    <div className="text-xl mb-1">{m.icon}</div>
                                                    <div className="text-xs">{m.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 p-3 bg-transparent border border-[var(--color-border)] rounded-lg hover:bg-white/5"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 p-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)]/90 font-bold"
                                        >
                                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الحلم'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
