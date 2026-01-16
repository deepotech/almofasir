'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function PricingPage() {
    const { user, loading: authLoading } = useAuth();
    const [price, setPrice] = useState<string>(''); // Using string for input
    const [responseTime, setResponseTime] = useState<number>(24);
    const [pricingNote, setPricingNote] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isInterpreter, setIsInterpreter] = useState(true); // Assumption until proven 404

    useEffect(() => {
        if (!authLoading && user) {
            fetchPricing();
        }
    }, [user, authLoading]);

    const fetchPricing = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/interpreter/pricing', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrice(data.price.toString());
                setResponseTime(data.responseTime);
                setPricingNote(data.pricingNote || '');
                setLastUpdated(data.lastPriceUpdate);
            } else if (res.status === 404) {
                setIsInterpreter(false);
                toast.error('أنت لست مسجلًا كمفسر حاليًا.');
            } else {
                toast.error('فشل تحميل بيانات التسعير');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 5) {
            toast.error('السعر يجب أن يكون رقمًا ولا يقل عن 5.');
            return;
        }

        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/interpreter/pricing', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    price: numPrice,
                    responseTime,
                    pricingNote
                })
            });

            const data = await res.json();

            if (res.ok) {
                setLastUpdated(new Date().toISOString());
                toast.success('تم تحديث إعدادات التسعير بنجاح');
            } else {
                toast.error(data.error || 'فشل التحديث');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) return <div className="p-2xl text-center text-gold">جاري التحميل... ⏳</div>;

    if (!user) {
        // ideally redirect
        return null;
    }

    if (!isInterpreter) {
        return (
            <div className="p-2xl text-center">
                <h1 className="text-2xl font-bold mb-md">لست مفسرًا</h1>
                <p>هذه الصفحة مخصصة للمفسرين فقط.</p>
                <Link href="/dashboard" className="text-primary hover:underline mt-md block">العودة للرئيسية</Link>
            </div>
        );
    }

    return (
        <div className="container animate-fadeIn max-w-2xl mx-auto p-4 md:p-8">
            <header className="mb-8 border-b border-white/10 pb-4">
                <h1 className="text-3xl font-bold text-gold mb-2">إعدادات التسعير 💰</h1>
                <p className="text-gray-400">حدد سعر تفسير الحلم وفق خبرتك ومدة الرد المتوقعة.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Price Field */}
                <div className="card p-6 bg-surface/50 rounded-xl border border-white/5">
                    <label className="block text-lg font-medium text-white mb-2">سعر تفسير الحلم</label>
                    <div className="relative">
                        <input
                            type="number"
                            min="5"
                            step="1"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-4 pl-16 rounded-lg bg-black/40 border border-white/10 focus:border-gold outline-none transition-colors text-xl font-bold text-white"
                            placeholder="30"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">SAR</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">السعر سيظهر للمستخدمين شاملًا الرسوم. (الحد الأدنى: 5 SAR)</p>
                </div>

                {/* Response Time Field */}
                <div className="card p-6 bg-surface/50 rounded-xl border border-white/5">
                    <label className="block text-lg font-medium text-white mb-2">مدة الرد المتوقعة <span className="text-red-500">*</span></label>
                    <select
                        value={responseTime}
                        onChange={(e) => setResponseTime(parseInt(e.target.value))}
                        className="w-full p-4 rounded-lg bg-black/40 border border-white/10 focus:border-gold outline-none transition-colors text-white cursor-pointer"
                    >
                        <option value={6}>خلال 6 ساعات</option>
                        <option value={12}>خلال 12 ساعة</option>
                        <option value={24}>خلال 24 ساعة</option>
                        <option value={48}>خلال 48 ساعة</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">⚠️ مدة الرد تُعرض للمستخدم وتؤثر على الترتيب في قائمة المفسرين.</p>
                </div>

                {/* Note Field */}
                <div className="card p-6 bg-surface/50 rounded-xl border border-white/5">
                    <label className="block text-lg font-medium text-white mb-2">ملاحظة للمستخدمين (اختياري)</label>
                    <textarea
                        value={pricingNote}
                        onChange={(e) => setPricingNote(e.target.value)}
                        className="w-full p-4 rounded-lg bg-black/40 border border-white/10 focus:border-gold outline-none transition-colors text-white min-h-[100px]"
                        placeholder="مثال: أقدّم تفسيرًا شرعيًا مفصلًا مع توضيح الرموز..."
                    />
                </div>

                {/* Guidelines */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                    <h4 className="text-gold font-bold mb-2 flex items-center gap-2">
                        <span>🔐</span> قيود وتنبيهات
                    </h4>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                        <li>لا يمكن تغيير السعر أكثر من مرة كل 24 ساعة.</li>
                        <li>الالتزام بمدة الرد ضروري للحفاظ على تقييمك.</li>
                        <li>سيتم خصم عمولة المنصة تلقائيًا من السعر المحدد.</li>
                    </ul>
                    {lastUpdated && (
                        <p className="text-xs text-gray-500 mt-2">آخر تحديث للسعر: {new Date(lastUpdated).toLocaleString('ar-SA')}</p>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full py-4 text-center rounded-lg font-bold text-lg transition-all ${saving
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-gold to-yellow-600 text-black hover:shadow-lg hover:shadow-gold/20 active:scale-[0.99]'
                            }`}
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                    <Link href="/dashboard" className="block text-center text-gray-400 hover:text-white mt-4 text-sm">
                        إلغاء والعودة
                    </Link>
                </div>
            </form>
        </div>
    );
}
