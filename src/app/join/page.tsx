'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
    CheckCircle,
    Users,
    Brain,
    Briefcase,
    Shield,
    BarChart,
    Send,
    Loader
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';

export default function JoinPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        country: '',
        experienceYears: '',
        interpretationType: 'religious',
        bio: '',
        sampleInterpretation: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setToast({ message: data.message || 'حدث خطأ ما', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'فشل الاتصال بالخادم', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="glass-card text-center p-12 max-w-lg w-full animate-fadeIn">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-gradient-gold">تم استلام طلبك بنجاح!</h1>
                        <p className="text-gray-300 mb-8 leading-relaxed">
                            شكراً لاهتمامك بالانضمام إلى فريق المفسر.
                            <br />
                            تم استلام طلبك وسيتم مراجعته من قبل الإدارة والتواصل معك قريباً عبر البريد الإلكتروني.
                        </p>
                        <a href="/" className="btn btn-primary block w-full py-3">العودة للرئيسية</a>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans">
            <Header />

            <main className="pb-20" style={{ paddingTop: '180px' }}>
                {/* 1️⃣ Hero Section */}
                <section className="container mx-auto px-6 text-center mb-24 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 animate-fadeIn">
                        ✨ انضم لنخبة المفسرين
                    </span>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                        هل أنت <span className="text-gradient-gold">مفسّر أحلام؟</span> <br />
                        انضم إلى منصة المفسّر
                    </h1>

                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        شارك علمك وخبرتك في تفسير الرؤى، وساعد آلاف المستخدمين عبر منصة احترافية تجمع بين الذكاء الاصطناعي والمفسّرين الحقيقيين.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <a href="#application-form" className="btn btn-primary btn-lg min-w-[200px]">
                            قدّم طلب الانضمام
                        </a>
                        <a href="#how-it-works" className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium">
                            تعرّف على آلية العمل
                        </a>
                    </div>
                </section>

                {/* 2️⃣ Benefits Section */}
                <section id="how-it-works" className="container mx-auto px-6 mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">لماذا تنضم كمفسّر لدينا؟</h2>
                        <p className="text-gray-400">مميزات صممت خصيصاً لراحتك</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Users, title: "عملاء جاهزون يومياً", desc: "لا داعي للبحث عن عملاء، لدينا قاعدة مستخدمين تبحث عنك." },
                            { icon: Brain, title: "تكامل مع الذكاء الاصطناعي", desc: "استفد من أدوات التحليل الأولي للأحلام لتسريع عملك." },
                            { icon: Briefcase, title: "العمل عن بُعد", desc: "فسّر الأحلام من منزلك وفي الوقت الذي يناسبك." },
                            { icon: Shield, title: "حماية لحقوق المفسّر", desc: "نضمن لك حقوقك المالية والأدبية بعقود واضحة." },
                            { icon: BarChart, title: "لوحة تحكم احترافية", desc: "أدوات متكاملة لإدارة طلباتك وأرباحك بسهولة." },
                            { icon: CheckCircle, title: "سمعة وموثوقية", desc: "انضم لمنصة تحظى بثقة آلاف المستخدمين." },
                        ].map((item, idx) => (
                            <div key={idx} className="glass-card p-6 flex flex-col items-center text-center group hover:translate-y-[-5px] transition-transform duration-300">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                                    <item.icon className="text-[var(--color-primary)]" size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-[250px]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3️⃣ Trust Section */}
                <section className="container mx-auto px-6 mb-24">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-bold mb-12">من يمكنه الانضمام؟</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-emerald-500/10 p-2 rounded-full">
                                        <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                                    </div>
                                    <span className="text-lg">خبرة عملية أو علم شرعي في تفسير الرؤى والأحلام.</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-emerald-500/10 p-2 rounded-full">
                                        <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                                    </div>
                                    <span className="text-lg">الالتزام بالأدب الشرعي والخصوصية التامة للمستخدمين.</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-emerald-500/10 p-2 rounded-full">
                                        <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                                    </div>
                                    <span className="text-lg">الجدية والوضوح في التفسير واللغة السليمة.</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-emerald-500/10 p-2 rounded-full">
                                        <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                                    </div>
                                    <span className="text-lg">احترام المستخدم وعدم إصدار فتاوى خارج إطار الرؤيا.</span>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-200 text-sm inline-flex items-center gap-3 px-6">
                                <Shield size={20} className="shrink-0" />
                                <span className="font-medium">نراجع جميع الطلبات يدويًا حفاظًا على جودة التفسير ومصداقية المنصة</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4️⃣ How to Earn Section - NEW */}
                <section className="container mx-auto px-6 mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">كيف تربح كمفسّر في المنصة؟</h2>
                        <p className="text-gray-400">نظام أرباح مرن وشفاف يضمن لك عائداً مجزياً</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="glass-card p-8 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                                <span className="text-2xl font-bold">$</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">حدد سعرك بنفسك</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                أنت من يحدد تكلفة التفسير الخاص بك. المنصة تضيف نسبة بسيطة كرسوم تشغيل، والمبلغ الذي تحدده يصلك كاملاً.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="glass-card p-8 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                                <BarChart size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">أرباح فورية</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                تضاف الأرباح إلى رصيدك فور إتمام التفسير. لا داعي للانتظار لنهاية الشهر لرؤية ثمرة مجهودك.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="glass-card p-8 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">سحب أرباح ميسّر</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                يمكنك طلب سحب أرباحك في أي وقت بمجرد وصولك للحد الأدنى، عبر طرق دفع متعددة وموثوقة.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5️⃣ Application Form */}
                <section id="application-form" className="container mx-auto px-6 mb-24">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-4">نموذج الانضمام</h2>
                            <p className="text-gray-400">ابدأ رحلتك معنا بملء البيانات التالية</p>
                        </div>

                        <div className="glass-card p-8 md:p-10 border-t-4 border-t-[var(--color-primary)]">
                            <form onSubmit={handleSubmit} className="space-y-10 text-right" dir="rtl">

                                {/* Section 1: Personal Info */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">1</div>
                                        <h3 className="text-xl font-bold text-white">البيانات الشخصية</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">الاسم الكامل <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                                className="input w-full text-right"
                                                placeholder="مثال: محمد أحمد"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">البريد الإلكتروني <span className="text-red-400">*</span></label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="input w-full text-right"
                                                placeholder="name@example.com"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">رقم الهاتف (اختياري)</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="input w-full text-right"
                                                placeholder="+966 ..."
                                                dir="ltr"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">الدولة <span className="text-red-400">*</span></label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                required
                                                className="input w-full text-right"
                                                placeholder="السعودية"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Experience & Methodology */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">2</div>
                                        <h3 className="text-xl font-bold text-white">الخبرة والمنهج</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">سنوات الخبرة <span className="text-red-400">*</span></label>
                                            <input
                                                type="number"
                                                name="experienceYears"
                                                value={formData.experienceYears}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                className="input w-full text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-200 mb-3">نوع التفسير <span className="text-red-400">*</span></label>
                                            <select
                                                name="interpretationType"
                                                value={formData.interpretationType}
                                                onChange={handleChange}
                                                className="input w-full cursor-pointer text-right"
                                            >
                                                <option value="religious">شرعي</option>
                                                <option value="psychological">نفسي</option>
                                                <option value="symbolic">رمزي</option>
                                                <option value="mixed">مختلط (شرعي/نفسي)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-200 mb-3">نبذة عنك كمفسّر <span className="text-red-400">*</span></label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="textarea w-full text-right"
                                            placeholder="تحدث بإيجاز عن خبرتك، منهجك في التفسير، ومؤهلاتك إن وجدت..."
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Section 3: Practical Sample */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">3</div>
                                        <h3 className="text-xl font-bold text-white">نموذج تفسير عملي</h3>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-200 mb-3">مثال على تفسير حلم سابق <span className="text-red-400">*</span></label>
                                        <p className="text-xs text-gray-500 mb-3">يرجى كتابة مثال لتبين أسلوبك في التعبير</p>
                                        <textarea
                                            name="sampleInterpretation"
                                            value={formData.sampleInterpretation}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="textarea w-full text-right"
                                            placeholder="الحلم: رأيت كذا وكذا... التفسير: ..."
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-amber-500/20"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader className="animate-spin" /> جاري الإرسال...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Send size={20} /> إرسال طلب الانضمام
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* 6️⃣ What Happens Next - NEW */}
                <section className="container mx-auto px-6 mb-10">
                    <div className="glass-card p-10 text-center">
                        <h2 className="text-2xl font-bold mb-10">ماذا يحدث بعد قبول طلبك؟</h2>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-20 right-20 h-0.5 bg-white/10 -z-0"></div>

                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center bg-[var(--color-bg-secondary)] p-6 rounded-2xl w-full md:w-1/3 border border-white/5">
                                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-500/30">1</div>
                                <h3 className="font-bold mb-2">إنشاء حساب مفسّر</h3>
                                <p className="text-sm text-gray-400">نرسل لك دعوة لإنشاء حسابك الخاص على المنصة.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center bg-[var(--color-bg-secondary)] p-6 rounded-2xl w-full md:w-1/3 border border-white/5">
                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-purple-500/30">2</div>
                                <h3 className="font-bold mb-2">تفعيل لوحة التحكم</h3>
                                <p className="text-sm text-gray-400">دخول كامل لأدوات التفسير وإدارة الطلبات.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center bg-[var(--color-bg-secondary)] p-6 rounded-2xl w-full md:w-1/3 border border-white/5">
                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-emerald-500/30">3</div>
                                <h3 className="font-bold mb-2">بدء استقبال الطلبات</h3>
                                <p className="text-sm text-gray-400">ابدأ في استقبال الأحلام وتحقيق الدخل فوراً.</p>
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
        </div>
    );
}
