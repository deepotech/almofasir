'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Toast, { ToastType } from '@/components/ui/Toast';
import { MessageSquare, User, Phone, Mail, Send, CheckCircle, Clock, Shield } from 'lucide-react';

// قائمة المفسرين المتاحين للدردشة
const availableInterpreters = [
    { id: 'sheikh-ahmad', name: 'الشيخ أحمد المفسر', specialty: 'تفسير شامل', status: 'online' },
    { id: 'sheikh-mohammed', name: 'الشيخ محمد العبيدي', specialty: 'الرؤى الروحانية', status: 'online' },
    { id: 'sheikh-ali', name: 'الشيخ علي الحكيم', specialty: 'التفسير النفسي', status: 'busy' },
];

export default function ChatPage() {
    const [formData, setFormData] = useState({
        interpreter: '',
        name: '',
        phone: '',
        email: '',
        dreamText: ''
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [requestSuccess, setRequestSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleInterpreterSelect = (interpreterId: string) => {
        setFormData(prev => ({ ...prev, interpreter: interpreterId }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // التحقق من البيانات
        if (!formData.interpreter || !formData.name || !formData.phone || !formData.dreamText) {
            setToast({
                message: 'يرجى ملء جميع الحقول المطلوبة',
                type: 'error'
            });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/chat-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    interpreterName: availableInterpreters.find(i => i.id === formData.interpreter)?.name,
                    type: 'chat'
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to submit request');

            setRequestSuccess(true);
            setToast({
                message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            setToast({
                message: 'عذراً، حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // شاشة النجاح
    if (requestSuccess) {
        return (
            <>
                <Header />
                <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                    <section className="section">
                        <div className="container">
                            <div className="glass-card text-center max-w-xl mx-auto" style={{ padding: '3rem' }}>
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle size={48} className="text-emerald-400" />
                                </div>
                                <h1 className="text-2xl font-bold mb-4 text-emerald-400">تم إرسال طلبك بنجاح!</h1>
                                <p className="text-gray-300 mb-6">
                                    شكراً لتواصلك معنا. سيتم التواصل معك عبر الواتساب على الرقم
                                    <span className="text-white font-bold mx-2" dir="ltr">{formData.phone}</span>
                                    لبدء جلسة الدردشة مع المفسر.
                                </p>
                                <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 mb-6">
                                    <h3 className="font-bold mb-3 text-[var(--color-primary)]">تفاصيل الطلب</h3>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        <p>المفسر: <span className="text-white">{availableInterpreters.find(i => i.id === formData.interpreter)?.name}</span></p>
                                        <p>نوع الخدمة: <span className="text-white">دردشة مباشرة</span></p>
                                        <p>التكلفة: <span className="text-white">39 ر.س</span></p>
                                    </div>
                                </div>
                                <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 mb-6">
                                    <p className="text-amber-200 text-sm">
                                        💡 سيتم التواصل معك خلال <strong>30 دقيقة</strong> كحد أقصى لبدء الجلسة
                                    </p>
                                </div>
                                <a href="/" className="btn btn-primary">
                                    العودة للصفحة الرئيسية
                                </a>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        {/* Hero Section */}
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                <MessageSquare size={32} className="text-white" />
                            </div>
                            <h1 className="mb-md">دردشة مباشرة مع مفسر معتمد</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                تواصل كتابياً مع أحد مفسرينا المعتمدين عبر الواتساب.
                                اشرح حلمك واحصل على تفسير مفصل مع إمكانية الأسئلة والاستفسارات.
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-pink-500/10 text-pink-400 px-4 py-2 rounded-full text-sm font-bold">
                                <span>39 ر.س</span>
                            </div>
                        </div>

                        {/* مميزات الخدمة */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                            <div className="glass-card text-center p-4">
                                <Clock size={24} className="mx-auto mb-2 text-indigo-400" />
                                <h4 className="font-bold text-sm mb-1">رد سريع</h4>
                                <p className="text-xs text-gray-400">خلال 30 دقيقة</p>
                            </div>
                            <div className="glass-card text-center p-4">
                                <MessageSquare size={24} className="mx-auto mb-2 text-emerald-400" />
                                <h4 className="font-bold text-sm mb-1">محادثة مفتوحة</h4>
                                <p className="text-xs text-gray-400">اسأل ما تشاء</p>
                            </div>
                            <div className="glass-card text-center p-4">
                                <Shield size={24} className="mx-auto mb-2 text-amber-400" />
                                <h4 className="font-bold text-sm mb-1">سرية تامة</h4>
                                <p className="text-xs text-gray-400">خصوصيتك محمية</p>
                            </div>
                        </div>

                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSubmit}>

                                {/* اختيار المفسر */}
                                <div className="glass-card mb-6" suppressHydrationWarning>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                            <User size={20} className="text-pink-400" />
                                        </div>
                                        <h3 className="font-bold">اختر المفسر للدردشة</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {availableInterpreters.map(interpreter => (
                                            <button
                                                key={interpreter.id}
                                                type="button"
                                                onClick={() => handleInterpreterSelect(interpreter.id)}
                                                className={`
                                                    p-4 rounded-xl text-center transition-all duration-300 border-2 relative
                                                    ${formData.interpreter === interpreter.id
                                                        ? 'bg-pink-600/20 border-pink-500 text-white'
                                                        : 'bg-[rgba(255,255,255,0.03)] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                    }
                                                `}
                                            >
                                                {/* Status indicator */}
                                                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${interpreter.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`} title={interpreter.status === 'online' ? 'متاح الآن' : 'مشغول'} />

                                                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                                                    👤
                                                </div>
                                                <span className="block font-bold text-sm mb-1">{interpreter.name}</span>
                                                <span className="block text-xs opacity-70">{interpreter.specialty}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* وصف الحلم */}
                                <div className="glass-card mb-6" suppressHydrationWarning>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <Send size={20} className="text-purple-400" />
                                        </div>
                                        <h3 className="font-bold">اكتب حلمك</h3>
                                    </div>
                                    <textarea
                                        name="dreamText"
                                        value={formData.dreamText}
                                        onChange={handleChange}
                                        rows={5}
                                        required
                                        placeholder="اكتب تفاصيل حلمك هنا بأكبر قدر ممكن من التفاصيل... كلما كانت التفاصيل أكثر، كان التفسير أدق."
                                        className="textarea w-full"
                                    />
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

                                    <div>
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
                                </div>

                                {/* ملخص وزر الإرسال */}
                                <div className="glass-card bg-gradient-to-br from-pink-900/20 to-rose-900/20" suppressHydrationWarning>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">تكلفة الدردشة</h3>
                                            <p className="text-gray-400 text-sm">محادثة واحدة كاملة حول حلمك</p>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <div className="text-3xl font-bold text-pink-400">39 ر.س</div>
                                            <p className="text-xs text-gray-500">يتم الدفع عند بدء الجلسة</p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-700 my-4" />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full text-lg py-4"
                                        style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
                                    >
                                        {loading ? 'جاري الإرسال...' : 'ابدأ الدردشة الآن'}
                                    </button>

                                    <p className="text-center text-gray-500 text-xs mt-3">
                                        سيتم التواصل معك عبر الواتساب خلال 30 دقيقة لبدء الجلسة
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

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
