'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// FAQ Data
const faqs = [
    {
        question: 'ما الفرق بين الرؤيا والحلم؟',
        answer: `الرؤيا الصادقة من الله تعالى، وتكون واضحة ومبشرة أو منذرة بخير أو شر. أما الحلم فمن الشيطان، ويكون مزعجاً أو مخيفاً. وهناك أيضاً أضغاث أحلام وهي حديث النفس ومما يشغل بال الإنسان.
    
قال النبي ﷺ: "الرُّؤْيَا الصَّالِحَةُ مِنَ اللَّهِ، وَالْحُلُمُ مِنَ الشَّيْطَانِ" (رواه البخاري)`,
    },
    {
        question: 'هل يجوز الاعتماد على تفسير الأحلام في اتخاذ القرارات؟',
        answer: `لا يجوز الاعتماد الكلي على تفسير الأحلام في اتخاذ القرارات المصيرية. الرؤيا قد تكون بشارة أو تحذير، لكنها ليست مصدراً للتشريع أو الأحكام.
    
الصحيح أن يستخير الإنسان ربه ويستشير أهل العلم والخبرة، ثم يتوكل على الله. والرؤيا الصالحة يُستبشر بها ولا يُبنى عليها.`,
    },
    {
        question: 'ماذا أفعل إذا رأيت حلماً مزعجاً؟',
        answer: `إذا رأيت ما تكره في منامك، فعليك:
    
1. أن تتفل عن يسارك ثلاثاً
2. أن تستعيذ بالله من الشيطان ومن شر ما رأيت
3. أن تتحول عن جنبك الذي كنت عليه
4. أن لا تحدث بها أحداً
5. أن تقوم فتصلي إن شئت

قال النبي ﷺ: "فإنها لا تضره" (رواه مسلم)`,
    },
    {
        question: 'هل كل ما نراه في المنام له تفسير؟',
        answer: `ليس كل ما يراه الإنسان في منامه له تفسير. فهناك:
    
1. الرؤيا الصادقة: من الله، ولها معنى وتفسير
2. الحلم: من الشيطان، لا ينبغي الالتفات إليه
3. أضغاث الأحلام: من حديث النفس، لا تفسير لها

والتمييز بينها يحتاج إلى فراسة ومعرفة بحال الرائي وصلاحه.`,
    },
    {
        question: 'من هم المفسرون المعتمدون تاريخياً؟',
        answer: `أشهر المفسرين في التاريخ الإسلامي:
    
1. محمد بن سيرين (ت 110هـ): أشهر مفسري الأحلام، عُرف بورعه وفراسته
2. عبد الغني النابلسي (ت 1143هـ): صاحب كتاب "تعطير الأنام في تفسير المنام"
3. ابن شاهين (ت 873هـ): صاحب "الإشارات في علم العبارات"

ومن المهم التنبه أن كثيراً مما ينسب لهم لم يثبت عنهم.`,
    },
    {
        question: 'هل يختلف التفسير باختلاف حال الرائي؟',
        answer: `نعم، يختلف التفسير باختلاف أحوال الرائي من عدة وجوه:
    
1. الجنس: الذكر والأنثى
2. الحالة الاجتماعية: متزوج، أعزب، مطلق
3. المهنة والعمل
4. الحالة النفسية
5. التقوى والصلاح

لذلك يحتاج المفسر إلى معرفة حال الرائي ليعطي تفسيراً دقيقاً.`,
    },
    {
        question: 'ما آداب قص الرؤيا على المفسر؟',
        answer: `من آداب قص الرؤيا:
    
1. لا تقصها إلا على من تحب وتثق به
2. لا تقصها على حاسد أو عدو
3. اختر الوقت المناسب (الصباح أفضل)
4. اذكر كل التفاصيل بصدق
5. لا تزد ولا تنقص مما رأيت

قال النبي ﷺ: "لا تقُصَّ رؤياك إلا على عالِمٍ أو ناصحٍ" (رواه الترمذي)`,
    },
    {
        question: 'ما حكم تعلم تفسير الأحلام؟',
        answer: `تعلم تفسير الأحلام مباح ومشروع، وقد فسّر يوسف عليه السلام الرؤى كما ورد في القرآن. لكن يجب مراعاة:
    
1. عدم الجزم بالتفسير (يُقال: لعله كذا، عسى أن يكون...)
2. التحري والتثبت قبل التفسير
3. عدم تفسير كل ما يُعرض عليك
4. الاستعانة بالله والتوكل عليه

والتخصص في هذا العلم يحتاج إلى دراسة وممارسة وفراسة.`,
    },
];

import Toast, { ToastType } from '@/components/ui/Toast';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [question, setQuestion] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const handleSubmit = async () => {
        if (!question.trim()) {
            setToast({ message: 'يرجى كتابة السؤال أولاً', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'زائر (سؤال شرعي)',
                    email: email || 'no-reply@almofasir.com',
                    subject: 'سؤال شرعي جديد من صفحة الأسئلة الشائعة',
                    message: `نص السؤال:\n${question}\n\nالبريد المقدم: ${email || 'لا يوجد'}`
                })
            });

            if (!res.ok) throw new Error('Failed to send');

            setToast({ message: 'تم إرسال سؤالك بنجاح! سنجيبك قريباً.', type: 'success' });
            setQuestion('');
            setEmail('');
        } catch (error) {
            setToast({ message: 'حدث خطأ. يرجى المحاولة لاحقاً.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            <main style={{ paddingTop: 100 }}>
                {/* Hero */}
                <section className="section">
                    <div className="container text-center">
                        <h1 className="mb-md">📜 الأسئلة الشرعية</h1>
                        <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                            إجابات على أهم الأسئلة الشرعية حول الرؤى والأحلام بإشراف متخصصين
                        </p>
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container" style={{ maxWidth: 800 }}>
                        <div className="card">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="faq-item">
                                    <button
                                        className="faq-question"
                                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                    >
                                        <span>{faq.question}</span>
                                        <span style={{ transform: openIndex === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                                            ▼
                                        </span>
                                    </button>
                                    {openIndex === idx && (
                                        <div className="faq-answer animate-fadeIn" style={{ whiteSpace: 'pre-line' }}>
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Ask Question CTA */}
                <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="container">
                        <div className="glass-card text-center" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <h3 className="mb-md">❓ لم تجد إجابة سؤالك؟</h3>
                            <p className="text-muted mb-xl">
                                أرسل سؤالك وسيجيب عليه متخصصون في العقيدة والفقه
                            </p>
                            <div style={{ maxWidth: 400, margin: '0 auto' }}>
                                <textarea
                                    className="textarea mb-md"
                                    placeholder="اكتب سؤالك هنا..."
                                    style={{ minHeight: 100 }}
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                />

                                <input
                                    type="email"
                                    className="input mb-lg w-full"
                                    placeholder="بريدك الإلكتروني (اختياري للرد)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'جاري الإرسال...' : 'إرسال السؤال'}
                                </button>
                                <p className="text-muted text-sm mt-md">
                                    سيتم الرد خلال 24-48 ساعة
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Related Links */}
                <section className="section">
                    <div className="container">
                        <h3 className="text-center mb-xl">📚 قد يهمك أيضاً</h3>
                        <div className="flex justify-center gap-lg" style={{ flexWrap: 'wrap' }}>
                            <Link href="/learn" className="btn btn-outline">
                                ← العودة للتعلم
                            </Link>
                            <Link href="/learn/psychology" className="btn btn-ghost">
                                علم النفس والأحلام
                            </Link>
                            <Link href="/symbols" className="btn btn-ghost">
                                مكتبة الرموز
                            </Link>
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
