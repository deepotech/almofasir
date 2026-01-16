'use client';

import { useState } from 'react';
import { Zap, UserCheck, UserX, Percent, Bot, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickActions() {
    const [loading, setLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string, label: string, payload: any } | null>(null);

    const handleAction = async () => {
        if (!confirmAction) return;
        setLoading(true);

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: confirmAction.type,
                    payload: confirmAction.payload
                })
            });

            if (res.ok) {
                toast.success(`Action ${confirmAction.label} successful`);
                setConfirmAction(null);
                // Optional: Trigger full page refresh or context update
            } else {
                const err = await res.json();
                toast.error(err.error || 'Action failed');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const actions = [
        {
            label: 'إيقاف/تشغيل AI',
            icon: Bot,
            color: 'bg-purple-500',
            action: () => setConfirmAction({
                type: 'PAUSE_AI',
                label: 'Toggle AI',
                payload: {}
            })
        },
        {
            label: 'تحديث العمولة (Global)',
            icon: Percent,
            color: 'bg-green-500',
            action: () => {
                const newRate = prompt('New Commission Rate (e.g. 0.3 for 30%)');
                if (newRate && !isNaN(parseFloat(newRate))) {
                    setConfirmAction({
                        type: 'UPDATE_COMMISSION',
                        label: 'Update Commission',
                        payload: { rate: parseFloat(newRate) }
                    });
                }
            }
        },
        // Example placeholders - in real app, these might need a user selector logic
        // For the "Click One Button" requirement, these usually target pending queues
        // or toggle global states. Specific user actions happen on user cards.
    ];

    return (
        <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Zap className="text-yellow-400" size={20} />
                إجراءات سريعة (Quick Actions)
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {actions.map((act, idx) => (
                    <button
                        key={idx}
                        onClick={act.action}
                        disabled={loading}
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
                    >
                        <div className={`p-3 rounded-full ${act.color}/20 group-hover:${act.color}/30`}>
                            <act.icon className={act.color.replace('bg-', 'text-')} size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-300">{act.label}</span>
                    </button>
                ))}
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-2">تأكيد الإجراء</h3>
                        <p className="text-gray-400 mb-6">
                            هل أنت متأكد من تنفيذ: <span className="text-white font-bold">{confirmAction.label}</span>؟
                            سيتم تسجيل هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2"
                            >
                                {loading ? 'جاري التنفيذ...' : 'تأكيد'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
