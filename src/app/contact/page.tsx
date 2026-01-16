'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Toast, { ToastType } from '@/components/ui/Toast';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to send message');

            setToast({
                message: 'تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت.',
                type: 'success'
            });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error(error);
            setToast({
                message: 'عذراً، حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <h1 className="mb-md">تواصل معنا</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                نحن هنا لمساعدتك. إذا كان لديك أي استفسار أو اقتراح، لا تتردد في مراسلتنا.
                                فريقنا جاهز للرد على جميع أسئلتك.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl" style={{ maxWidth: 1000, margin: '0 auto' }} suppressHydrationWarning>
                            {/* Contact Info */}
                            <div suppressHydrationWarning>
                                <div className="glass-card mb-xl" suppressHydrationWarning>
                                    <h3 className="mb-lg">معلومات الاتصال</h3>

                                    <a
                                        href="mailto:support@almofasir.com"
                                        className="flex items-start gap-md mb-lg hover:bg-white/5 p-2 rounded-lg transition-colors"
                                    >
                                        <div className="text-2xl">📧</div>
                                        <div>
                                            <h4 className="text-base font-bold mb-xs">البريد الإلكتروني</h4>
                                            <p className="text-muted">support@almofasir.com</p>
                                        </div>
                                    </a>

                                    <a
                                        href="https://wa.me/212641638647"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-md mb-lg hover:bg-white/5 p-2 rounded-lg transition-colors"
                                    >
                                        <div className="text-2xl">📱</div>
                                        <div>
                                            <h4 className="text-base font-bold mb-xs">واتساب</h4>
                                            <p className="text-muted" dir="ltr">+212 641 638 647</p>
                                        </div>
                                    </a>

                                    <div className="flex items-start gap-md p-2">
                                        <div className="text-2xl">📍</div>
                                        <div>
                                            <h4 className="text-base font-bold mb-xs">العنوان</h4>
                                            <p className="text-muted">الرياض، المملكة العربية السعودية</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card bg-[var(--color-bg-secondary)]" suppressHydrationWarning>
                                    <h3 className="mb-md">ساعات العمل</h3>
                                    <p className="text-muted mb-sm">نحن متواجدون للرد على استفساراتكم:</p>
                                    <p className="font-bold">يومياً من الساعة 9 صباحاً حتى 10 مساءً</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="glass-card" suppressHydrationWarning>
                                <h3 className="mb-xl">أرسل لنا رسالة</h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-md" suppressHydrationWarning>
                                        <label className="block text-sm mb-xs text-[var(--color-text-muted)]">الاسم</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input w-full"
                                            placeholder="اسمك الكريم"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-md" suppressHydrationWarning>
                                        <label className="block text-sm mb-xs text-[var(--color-text-muted)]">البريد الإلكتروني</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="input w-full"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-md" suppressHydrationWarning>
                                        <label className="block text-sm mb-xs text-[var(--color-text-muted)]">الموضوع</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            required
                                            className="input w-full"
                                            placeholder="عنوان رسالتك"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-lg" suppressHydrationWarning>
                                        <label className="block text-sm mb-xs text-[var(--color-text-muted)]">الرسالة</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={5}
                                            className="textarea w-full"
                                            placeholder="اكتب رسالتك هنا..."
                                            value={formData.message}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full"
                                    >
                                        {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                                    </button>
                                </form>
                            </div>
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
