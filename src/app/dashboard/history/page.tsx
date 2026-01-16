'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DreamHistoryCard from '@/components/dashboard/DreamHistoryCard';

export default function HistoryPage() {
    const { user } = useAuth();
    const [dreams, setDreams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [requestingId, setRequestingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDreams = async () => {
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/dreams?limit=50', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                setDreams(data.dreams || []);
            } catch (error) {
                console.error('Fetch error:', error);
                // Optionally show toast or error state
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDreams();
        }
    }, [user]);

    const handleRequestReview = async (dreamId: string) => {
        setRequestingId(dreamId);
        try {
            const token = await user?.getIdToken();
            if (!token) return;

            const res = await fetch(`/api/dreams/${dreamId}/request-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user?.uid })
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'فشل الطلب');
            } else {
                toast.success('تم إرسال طلب المراجعة البشرية بنجاح');
                // Update local state
                setDreams(prev => prev.map(d =>
                    d._id === dreamId ? { ...d, requestHumanReview: true, humanReviewStatus: 'pending' } : d
                ));
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ ما');
        } finally {
            setRequestingId(null);
        }
    };

    const filteredDreams = dreams.filter(dream =>
        dream.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dream.keywords?.some((k: string) => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 w-full mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--color-bg-card)] p-6 rounded-[2rem] border border-[var(--color-border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)] bg-clip-text text-transparent mb-2">
                        سجل الأحلام
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        رحلتك الروحية عبر عالم الرؤى
                    </p>
                </div>

                <div className="relative group w-full md:w-72">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
                    <div className="relative flex items-center bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
                        <span className="pr-4 pl-2 text-[var(--color-text-muted)]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="بحث في أرشيف رؤاك..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none py-3 pl-4 focus:ring-0 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]/50"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-[var(--color-bg-card)]/50 animate-pulse rounded-[2rem] border border-[var(--color-border)]/50"></div>
                    ))}
                </div>
            ) : filteredDreams.length === 0 ? (
                <div className="text-center py-24 bg-[var(--color-bg-card)]/30 rounded-[2rem] border border-[var(--color-border)] border-dashed backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center animate-bounce-slow">
                        <span className="text-4xl">🌙</span>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">لم يتم العثور على أحلام</h3>
                    <p className="text-[var(--color-text-muted)]">ابدأ بتدوين أحلامك لتراها تظهر هنا في سجلك الذهبي</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDreams.map((dream, index) => (
                        <DreamHistoryCard
                            key={dream._id}
                            dream={dream}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
