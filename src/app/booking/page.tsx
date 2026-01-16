'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Toast, { ToastType } from '@/components/ui/Toast';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react';

// الأوقات المتاحة للحجز (Hardcoded for now)
const availableTimeSlots = [
    { id: 'morning-1', time: '09:00 صباحاً', period: 'morning' },
    { id: 'morning-2', time: '10:00 صباحاً', period: 'morning' },
    { id: 'morning-3', time: '11:00 صباحاً', period: 'morning' },
    { id: 'afternoon-1', time: '02:00 مساءً', period: 'afternoon' },
    { id: 'afternoon-2', time: '03:00 مساءً', period: 'afternoon' },
    { id: 'afternoon-3', time: '04:00 مساءً', period: 'afternoon' },
    { id: 'evening-1', time: '07:00 مساءً', period: 'evening' },
    { id: 'evening-2', time: '08:00 مساءً', period: 'evening' },
    { id: 'evening-3', time: '09:00 مساءً', period: 'evening' },
];

function BookingContent() {
    const searchParams = useSearchParams();
    const initialInterpreterId = searchParams.get('interpreter') || '';

    const [availableInterpreters, setAvailableInterpreters] = useState<any[]>([]);
    const [fetchingInterpreters, setFetchingInterpreters] = useState(true);

    const [formData, setFormData] = useState({
        interpreter: initialInterpreterId,
        date: '',
        time: '',
        name: '',
        phone: '',
        email: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    useEffect(() => {
        // Fetch Interpreters from API
        const fetchInterpreters = async () => {
            try {
                const res = await fetch('/api/interpreters');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableInterpreters(data.interpreters.map((i: any) => ({
                        id: i.id,
                        name: i.displayName,
                        specialty: i.interpretationTypeAr || 'شامل',
                        price: i.price
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch interpreters', error);
            } finally {
                setFetchingInterpreters(false);
            }
        };
        fetchInterpreters();
    }, []);

    // Update formData if URL param changes or initial load matches
    useEffect(() => {
        if (initialInterpreterId) {
            setFormData(prev => ({ ...prev, interpreter: initialInterpreterId }));
        }
    }, [initialInterpreterId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleTimeSelect = (timeId: string) => {
        setFormData(prev => ({ ...prev, time: timeId }));
    };

    // الحصول على تاريخ اليوم بتنسيق YYYY-MM-DD
    const getMinDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // يبدأ الحجز من الغد
        return today.toISOString().split('T')[0];
    };

    // الحصول على أقصى تاريخ متاح (30 يوم من اليوم)
    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // التحقق من البيانات
        if (!formData.interpreter || !formData.date || !formData.time || !formData.name || !formData.phone) {
            setToast({
                message: 'يرجى ملء جميع الحقول المطلوبة',
                type: 'error'
            });
            return;
        }

        setLoading(true);

        try {
            // حفظ بيانات الحجز في التخزين المحلي
            const selectedInterpreter = availableInterpreters.find(i => i.id === formData.interpreter);
            const bookingData = {
                ...formData,
                interpreterName: selectedInterpreter?.name,
                timeSlot: availableTimeSlots.find(t => t.id === formData.time)?.time,
                price: selectedInterpreter?.price || 14.99 // Use dynamic price or default
            };

            localStorage.setItem('pending_booking', JSON.stringify(bookingData));

            // التوجيه إلى صفحة الدفع
            window.location.href = '/checkout?type=booking';

        } catch (error) {
            console.error(error);
            setToast({
                message: 'حدث خطأ غير متوقع',
                type: 'error'
            });
            setLoading(false);
        }
    };

    return (
        <>
            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        {/* Hero Section */}
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Calendar size={32} className="text-white" />
                            </div>
                            <h1 className="mb-md">حجز موعد مع مفسر معتمد</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                احجز جلسة تفسير خاصة مع أحد مفسرينا المعتمدين.
                                سيتم التواصل معك عبر الواتساب لتأكيد الموعد وإتمام الجلسة.
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold">
                                <span>$14.99 / جلسة</span>
                            </div>
                        </div>

                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                                    {/* اختيار المفسر */}
                                    <div className="glass-card" suppressHydrationWarning>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                                <User size={20} className="text-indigo-400" />
                                            </div>
                                            <h3 className="font-bold">اختر المفسر</h3>
                                        </div>
                                        <select
                                            name="interpreter"
                                            value={formData.interpreter}
                                            onChange={handleChange}
                                            required
                                            className="input w-full"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="">-- اختر المفسر --</option>
                                            {availableInterpreters.map(interpreter => (
                                                <option key={interpreter.id} value={interpreter.id}>
                                                    {interpreter.name} - {interpreter.specialty}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* اختيار التاريخ */}
                                    <div className="glass-card" suppressHydrationWarning>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                                <Calendar size={20} className="text-purple-400" />
                                            </div>
                                            <h3 className="font-bold">اختر التاريخ</h3>
                                        </div>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            min={getMinDate()}
                                            max={getMaxDate()}
                                            required
                                            className="input w-full"
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                {/* اختيار الوقت */}
                                <div className="glass-card mb-6" suppressHydrationWarning>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <Clock size={20} className="text-amber-400" />
                                        </div>
                                        <h3 className="font-bold">اختر الوقت المناسب</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {availableTimeSlots.map(slot => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => handleTimeSelect(slot.id)}
                                                className={`
                                                    p-3 rounded-xl text-center transition-all duration-300 border-2
                                                    ${formData.time === slot.id
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                        : 'bg-[rgba(255,255,255,0.03)] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                    }
                                                `}
                                            >
                                                <span className="text-sm font-bold">{slot.time}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* بيانات الاتصال */}
                                <div className="glass-card mb-6" suppressHydrationWarning>
                                    <h3 className="font-bold mb-4">بيانات الاتصال</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                                                <User size={16} />
                                                الاسم الكريم <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="أدخل اسمك"
                                                className="input w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                                                <Phone size={16} />
                                                رقم الواتساب <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                placeholder="+966 5XX XXX XXXX"
                                                className="input w-full"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                                            <Mail size={16} />
                                            البريد الإلكتروني (اختياري)
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            className="input w-full"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                                            <MessageSquare size={16} />
                                            ملاحظات أو وصف مختصر للحلم (اختياري)
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="اكتب ملاحظاتك هنا أو وصف مختصر لحلمك..."
                                            className="textarea w-full"
                                        />
                                    </div>
                                </div>

                                {/* ملخص وزر الحجز */}
                                <div className="glass-card bg-gradient-to-br from-indigo-900/20 to-purple-900/20" suppressHydrationWarning>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">إجمالي الجلسة</h3>
                                            <p className="text-gray-400 text-sm">مدة الجلسة: 30-45 دقيقة عبر الواتساب</p>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <div className="text-3xl font-bold text-[var(--color-primary)]">
                                                {availableInterpreters.find(i => i.id === formData.interpreter)?.price ? (
                                                    `$${availableInterpreters.find(i => i.id === formData.interpreter)?.price}`
                                                ) : (
                                                    '$14.99'
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">يتم الدفع بعد تأكيد الموعد</p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-700 my-4" />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full text-lg py-4"
                                    >
                                        {loading ? 'جاري التحويل...' : (
                                            `المتابعة للدفع (${availableInterpreters.find(i => i.id === formData.interpreter)?.price ? (
                                                `$${availableInterpreters.find(i => i.id === formData.interpreter)?.price}`
                                            ) : (
                                                '$14.99'
                                            )
                                            })`
                                        )}
                                    </button>

                                    <p className="text-center text-gray-500 text-xs mt-3">
                                        بالضغط على تأكيد الحجز، أنت توافق على شروط الخدمة وسياسة الخصوصية
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري تحميل صفحة الحجز...</div>}>
            <Header />
            <BookingContent />
            <Footer />
        </Suspense>
    );
}
