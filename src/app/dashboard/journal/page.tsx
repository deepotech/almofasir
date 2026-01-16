'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DreamFilters, { FilterState } from '@/components/dashboard/DreamFilters';
import Image from 'next/image';
import DreamHistoryCard from '@/components/dashboard/DreamHistoryCard';

interface Dream {
    _id: string;
    content: string;
    date: string;
    mood: string;
    keywords: string[];
    interpreter?: string;
    interpretation?: {
        summary: string;
        aiGenerated?: boolean;
        humanResponse?: string;
        isPremium?: boolean;
    };
    requestHumanReview?: boolean;
    humanReviewStatus?: 'none' | 'pending' | 'completed';
    type?: 'ai' | 'human';
    status?: string;
    price?: number;
}

export default function JournalPage() {
    const { user } = useAuth();
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        search: '',
        dateRange: 'all',
        type: 'all',
        status: 'all',
        interpreter: 'all',
    });

    useEffect(() => {
        if (user?.uid) {
            const fetchAllDreams = async () => {
                try {
                    const token = await user.getIdToken();
                    const headers = { Authorization: `Bearer ${token}` };

                    const [aiRes, humanRes] = await Promise.all([
                        fetch('/api/dreams?limit=50', { headers }),
                        // Updated to use unified /api/orders endpoint
                        fetch('/api/orders?type=HUMAN', { headers })
                    ]);

                    const aiData = await aiRes.json().catch(() => ({ dreams: [] }));
                    const humanData = await humanRes.json().catch(() => ({ orders: [] }));

                    const aiDreams = (aiData.dreams || []).map((d: any) => ({ ...d, type: 'ai' }));
                    // Map orders to match Dream interface
                    const humanDreams = (humanData.orders || []).map((d: any) => ({
                        _id: d._id,
                        content: d.dreamText,
                        date: d.createdAt,
                        mood: d.context?.dominantFeeling || 'neutral',
                        keywords: [],
                        interpreter: d.interpreterName,
                        interpretation: d.interpretationText ? {
                            summary: d.interpretationText.substring(0, 100) + '...', // Summary
                            humanResponse: d.interpretationText,
                            aiGenerated: false,
                            isPremium: true
                        } : undefined,
                        type: 'human',
                        status: d.status, // Preserve status for UI
                        price: d.price
                    }));

                    // Merge and sort by date descending
                    const allDreams = [...aiDreams, ...humanDreams].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    setDreams(allDreams);
                } catch (error) {
                    console.error('Failed to fetch dreams:', error);
                    toast.error('حدث خطأ في تحميل الأحلام');
                } finally {
                    setLoading(false);
                }
            };

            fetchAllDreams();
        }
    }, [user]);

    const handleRequestReview = async (dreamId: string) => {
        setRequestingId(dreamId);
        try {
            const token = await user?.getIdToken();
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

    // Client-side filtering logic
    const filteredDreams = useMemo(() => {
        return dreams.filter(dream => {
            // Search filter
            if (activeFilters.search) {
                const searchLower = activeFilters.search.toLowerCase();
                const contentMatch = dream.content?.toLowerCase().includes(searchLower);
                const keywordsMatch = dream.keywords?.some(k => k.toLowerCase().includes(searchLower));
                const summaryMatch = dream.interpretation?.summary?.toLowerCase().includes(searchLower);
                if (!contentMatch && !keywordsMatch && !summaryMatch) return false;
            }

            // Date range filter (Dashboard filter logic)
            if (activeFilters.dateRange !== 'all') {
                const dreamDate = new Date(dream.date);
                const now = new Date();
                if (activeFilters.dateRange === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (dreamDate < weekAgo) return false;
                } else if (activeFilters.dateRange === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (dreamDate < monthAgo) return false;
                } else if (activeFilters.dateRange === 'year') {
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    if (dreamDate < yearAgo) return false;
                }
            }

            // Type filter
            if (activeFilters.type !== 'all') {
                const isAI = dream.interpretation?.aiGenerated !== false;
                if (activeFilters.type === 'ai' && !isAI) return false;
                if (activeFilters.type === 'human' && isAI) return false;
            }

            // Status filter
            if (activeFilters.status !== 'all') {
                let status = 'completed';

                if (dream.type === 'human') {
                    if (dream.status === 'completed') status = 'reviewed'; // Map 'completed' to 'reviewed' filter if that's what 'completed' means in filter, or just 'completed'
                    else if (dream.status === 'in_progress' || dream.status === 'pending_interpretation' || dream.status === 'pending') status = 'pending';
                    else status = 'completed'; // default
                } else {
                    // AI Dream Logic
                    status = dream.humanReviewStatus === 'completed' ? 'reviewed'
                        : dream.requestHumanReview ? 'pending'
                            : 'completed';
                }

                // If filter is 'reviewed', we show completed human dreams?
                // If filter is 'pending', we show new/in_progress human dreams.
                // The filter options usually are 'all', 'pending', 'reviewed' (or 'completed'?)
                // Let's assume standard filters: 'all', 'pending', 'completed'.

                // Adjust matching:
                if (activeFilters.status === 'pending' && status !== 'pending') return false;
                if (activeFilters.status === 'completed' && status !== 'completed' && status !== 'reviewed') return false;
                // If specific other statuses exist in filters, handle them.
            }

            // Interpreter filter
            if (activeFilters.interpreter !== 'all') {
                if (dream.interpreter !== activeFilters.interpreter) return false;
            }

            return true;
        });
    }, [dreams, activeFilters]);

    // Grouping Logic
    const groupedDreams = useMemo(() => {
        const groups: Record<string, Dream[]> = {
            'today': [],
            'yesterday': [],
            'week': [],
            'month': [],
            'older': []
        };

        filteredDreams.forEach(dream => {
            const date = new Date(dream.date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) groups['today'].push(dream);
            else if (diffDays <= 2) groups['yesterday'].push(dream);
            else if (diffDays <= 7) groups['week'].push(dream);
            else if (diffDays <= 30) groups['month'].push(dream);
            else groups['older'].push(dream);
        });

        return groups;
    }, [filteredDreams]);

    const renderDreamGroup = (title: string, groupDreams: Dream[]) => {
        if (groupDreams.length === 0) return null;
        return (
            <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                    {title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupDreams.map((dream, index) => (
                        <motion.div
                            key={dream._id}
                            className="relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <DreamHistoryCard
                                dream={dream}
                                onRequestReview={handleRequestReview}
                                isRequesting={requestingId === dream._id}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
            {/* Header Section */}
            <div className="mb-8 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--color-bg-card)] to-[var(--color-bg-tertiary)] border border-[var(--color-border)] p-8">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                        سجل الأحلام
                    </h1>
                    <p className="text-[var(--color-text-muted)]">
                        جميع أحلامك محفوظة هنا لتعود إليها، تقارن بينها، وتلاحظ الإشارات المتكررة.
                    </p>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl"></div>
            </div>

            {/* Smart Filter Bar */}
            <div className="mb-8 sticky top-4 z-30">
                <DreamFilters onFilterChange={setActiveFilters} />
            </div>

            {/* Dreams List */}
            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-[var(--color-bg-card)]/50 animate-pulse rounded-2xl border border-[var(--color-border)]/50"></div>
                    ))}
                </div>
            ) : filteredDreams.length === 0 ? (
                <div className="text-center py-24 bg-[var(--color-bg-card)]/30 rounded-[2rem] border border-[var(--color-border)] border-dashed backdrop-blur-sm">
                    <span className="text-4xl block mb-4">🔍</span>
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">لا توجد أحلام مطابقة</h3>
                    <p className="text-[var(--color-text-muted)]">جرب تغيير معايير البحث أو تدوين حلم جديد.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {renderDreamGroup('اليوم', groupedDreams['today'])}
                    {renderDreamGroup('أمس', groupedDreams['yesterday'])}
                    {renderDreamGroup('هذا الأسبوع', groupedDreams['week'])}
                    {renderDreamGroup('هذا الشهر', groupedDreams['month'])}
                    {renderDreamGroup('أرشيف الأحلام', groupedDreams['older'])}
                </div>
            )}
        </div>
    );
}


