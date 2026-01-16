'use client';

import { useState, useEffect } from 'react';
import { Check, X, FileText } from 'lucide-react';

export default function RequestsPage() {
    // Mock Join Requests
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch('/api/admin/requests');
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data.requests);
                }
            } catch (error) {
                console.error('Failed to fetch requests', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const handleAccept = async (reqId: string, email: string, name: string) => {
        if (!confirm('هل أنت متأكد من قبول هذا المفسر؟')) return;

        try {
            const res = await fetch('/api/admin/interpreters/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: reqId, email, name })
            });

            if (res.ok) {
                // Remove from list
                setRequests(prev => prev.filter(r => r._id !== reqId));
                alert('تم قبول المفسر بنجاح وإرسال إيميل الترحيب!');
            } else {
                alert('حدث خطأ أثناء القبول');
            }
        } catch (error) {
            console.error('Error accepting:', error);
            alert('فشل الاتصال بالخادم');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400" suppressHydrationWarning>جاري تحميل الطلبات...</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn" suppressHydrationWarning>
            <h1 className="text-2xl font-bold">طلبات الانضمام الجديدة</h1>
            <p className="text-gray-400">راجع نماذج التفسير قبل قبول الطلب لضمان الجودة.</p>

            {requests.length === 0 ? (
                <div className="text-center p-12 bg-[#0a0a1a] border border-white/5 rounded-xl">
                    <p className="text-gray-400">لا توجد طلبات انضمام جديدة حالياً.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{req.fullName}</h3>
                                    <p className="text-sm text-gray-400">
                                        {req.email} • {req.phone && <span>{req.phone} • </span>}
                                        خبرة {req.experienceYears} • منهج {req.interpretationType}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">الدولة: {req.country}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAccept(req._id, req.email, req.fullName)}
                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg font-bold transition-colors"
                                    >
                                        <Check size={18} /> قبول
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg font-bold transition-colors">
                                        <X size={18} /> رفض
                                    </button>
                                </div>
                            </div>


                            <div className="p-6 bg-white/[0.02]">
                                <h4 className="flex items-center gap-2 font-bold mb-3 text-sm text-[var(--color-primary-light)]">
                                    <FileText size={16} /> نموذج التفسير المقدم:
                                </h4>
                                <p className="text-gray-300 leading-relaxed bg-[#050510] p-4 rounded-lg border border-white/5">
                                    "{req.sampleInterpretation}"
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <h4 className="text-xs text-gray-500 mb-2">نبذة عن المفسر:</h4>
                                    <p className="text-sm text-gray-400">{req.bio}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
