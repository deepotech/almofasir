'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Clock, User, ArrowRight, Wallet, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Request {
    _id: string;
    dreamText: string;
    status: 'new' | 'in_progress' | 'completed' | 'clarification_requested' | 'closed';
    price: number;
    // interpreterEarnings might not be directly in the list object depending on API, but we can infer or it's 'price' locked
    // The API sends: interpreterName, price, currency, status, paymentStatus, etc.
    // Let's assume price is the full price, and earning is calculated or returned. 
    // Checking /api/interpreter/dream-requests/route.ts (Step 162), it returns `dreamText, status, price, currency, createdAt`.
    // It filters filter for PAID requests only.
    createdAt: string;
    currency: string;
}

export default function InterpreterRequestsPage() {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<Request[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'in_progress' | 'completed'>('new');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                // Use NEW API
                const res = await fetch('/api/interpreter/dream-requests', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    let fetchedRequests = data.requests || [];

                    // CRITICAL: Client-side deduplication to ensure ZERO duplicates
                    const seen = new Set<string>();
                    fetchedRequests = fetchedRequests.filter((req: Request) => {
                        const isDuplicate = seen.has(req._id);
                        seen.add(req._id);
                        return !isDuplicate; // Keep only if NOT duplicate
                    });

                    console.log(`[Interpreter Dashboard] Loaded ${fetchedRequests.length} unique requests`);
                    setAllRequests(fetchedRequests);
                } else {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || 'فشل تحميل الطلبات');
                }
            } catch (err: any) {
                console.error(err);
                setError(`Connection Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRequests();
        }
    }, [user]);

    const displayedRequests = allRequests.filter(req => {
        if (activeTab === 'new') return req.status === 'new' || req.status === 'pending'; // 'pending' fallback
        if (activeTab === 'in_progress') return req.status === 'in_progress' || req.status === 'assigned' || req.status === 'clarification_requested';
        if (activeTab === 'completed') return req.status === 'completed' || req.status === 'answered' || req.status === 'closed';
        return false;
    });

    const counts = {
        new: allRequests.filter(r => r.status === 'new' || r.status === 'pending').length,
        in_progress: allRequests.filter(r => r.status === 'in_progress' || r.status === 'assigned' || r.status === 'clarification_requested').length,
        completed: allRequests.filter(r => r.status === 'completed' || r.status === 'answered' || r.status === 'closed').length
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400 animate-pulse">جاري تحميل الطلبات...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold mb-4">إدارة الطلبات 📥</h1>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-white/10 pb-4 mb-6">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${activeTab === 'new' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        الأحلام الواردة
                        {counts.new > 0 && <span className="mr-2 px-2 py-0.5 bg-[var(--color-primary)] text-white text-xs rounded-full">{counts.new}</span>}
                        {activeTab === 'new' && <motion.div layoutId="activeTab" className="absolute bottom-0 right-0 w-full h-0.5 bg-[var(--color-primary)]" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('in_progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${activeTab === 'in_progress' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        قيد التفسير
                        {counts.in_progress > 0 && <span className="mr-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">{counts.in_progress}</span>}
                        {activeTab === 'in_progress' && <motion.div layoutId="activeTab" className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-500" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${activeTab === 'completed' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        المكتملة
                        {activeTab === 'completed' && <motion.div layoutId="activeTab" className="absolute bottom-0 right-0 w-full h-0.5 bg-emerald-500" />}
                    </button>
                </div>
            </div>

            {displayedRequests.length === 0 ? (
                <div className="glass-card p-12 text-center text-gray-400 flex flex-col items-center">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">لا توجد طلبات في هذه القائمة</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {displayedRequests.map((req) => (
                        <motion.div
                            key={req._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 border-r-4 border-r-[var(--color-primary)] hover:bg-white/5 transition-all group"
                        >
                            <div className="flex justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span className={`px-2 py-1 rounded border ${req.status === 'new' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            req.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            {req.status === 'new' ? 'جديد' :
                                                req.status === 'in_progress' ? 'قيد التفسير' :
                                                    req.status === 'clarification_requested' ? 'يوجد استفسار' :
                                                        req.status === 'completed' ? 'مكتمل' : req.status}
                                        </span>
                                        <span>•</span>
                                        <span>منذ {new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                                    </div>

                                    <p className="text-gray-200 line-clamp-2 leading-relaxed font-medium">
                                        {req.dreamText}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end justify-between min-w-[120px]">
                                    <div className="text-end">
                                        <div className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                                            <Wallet size={16} />
                                            {/* Showing full price for now as earning logic is backend */}
                                            <span>{req.price} {req.currency}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/interpreter/dashboard/requests/${req._id}`}
                                        className="mt-4 px-4 py-2 bg-[var(--color-primary)] hover:bg-violet-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        فتح الطلب <ArrowRight size={16} className="rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
