'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, Clock, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SettingsData {
    commissionRate: number;
    aiPriceSingle: number;
    aiPriceMonthly: number;
    humanMinPrice: number;
    humanMaxPrice: number;
    maxResponseTimeHours: number;
    stuckOrderThresholdHours: number;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
}

const safeValue = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val;
};

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/settings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data.settings);
                }
            } catch (e) {
                console.error("Failed to fetch settings", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !settings) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                alert('تم حفظ الإعدادات بنجاح');
            } else {
                alert('فشل الحفظ');
            }
        } catch (e) {
            console.error("Failed to save", e);
            alert('حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="text-red-500" />
                إعدادات المنصة
            </h1>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Finance Settings */}
                <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-green-400">
                        <DollarSign size={20} />
                        الأسعار والعمولات
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">نسبة عمولة المنصة (0.1 = 10%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                max="1"
                                value={safeValue(settings.commissionRate)}
                                onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">سعر تفسير AI (مفرد)</label>
                            <input
                                type="number"
                                step="0.01"
                                step="0.01"
                                value={safeValue(settings.aiPriceSingle)}
                                onChange={(e) => setSettings({ ...settings, aiPriceSingle: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">أقل سعر للمفسر البشري</label>
                            <input
                                type="number"
                                value={safeValue(settings.humanMinPrice)}
                                onChange={(e) => setSettings({ ...settings, humanMinPrice: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">أعلى سعر للمفسر البشري</label>
                            <input
                                type="number"
                                value={safeValue(settings.humanMaxPrice)}
                                onChange={(e) => setSettings({ ...settings, humanMaxPrice: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Operational Settings */}
                <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
                        <Clock size={20} />
                        الحدود الزمنية
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">الحد الأقصى للرد (ساعات)</label>
                            <input
                                type="number"
                                value={safeValue(settings.maxResponseTimeHours)}
                                onChange={(e) => setSettings({ ...settings, maxResponseTimeHours: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">تنبيه الطلبات العالقة بعد (ساعات)</label>
                            <input
                                type="number"
                                value={safeValue(settings.stuckOrderThresholdHours)}
                                onChange={(e) => setSettings({ ...settings, stuckOrderThresholdHours: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* System Mode */}
                <div className="bg-[#0a0a1a] border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-400">
                        <AlertCircle size={20} />
                        وضع النظام
                    </h2>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode ?? false}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </div>
                            <span className="text-white font-medium">وضع الصيانة</span>
                        </label>
                        <p className="text-sm text-gray-500">عند التفعيل، لن يتمكن المستخدمون من الطلب.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        </div>
    );
}
