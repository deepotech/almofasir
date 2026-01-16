'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function PsychologyPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-3xl" suppressHydrationWarning>
                            <h1 className="mb-md">🧠 علم النفس والأحلام</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                كيف يفسر العلم العقل الباطن وما يدور فيه أثناء النوم؟
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl mb-3xl" suppressHydrationWarning>
                            <div className="glass-card" suppressHydrationWarning>
                                <div className="text-4xl mb-md">🧔🏻‍♂️</div>
                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">سيجموند فرويد</h3>
                                <p className="text-muted leading-relaxed">
                                    يعتبر فرويد أن الأحلام هي "الطريق الملكي إلى اللاوعي". ويرى أنها تمثل رغبات مكبوته تسعى للظهور، غالباً ما تكون ذات طابع غريزي أو عاطفي، وتتخفى خلف رموز لتجاوز "رقابة" العقل الواعي.
                                </p>
                            </div>

                            <div className="glass-card" suppressHydrationWarning>
                                <div className="text-4xl mb-md">👴🏻</div>
                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">كارل يونغ</h3>
                                <p className="text-muted leading-relaxed">
                                    اختلف يونغ مع فرويد، ورأى أن الأحلام ليست مجرد رغبات مكبوتة، بل هي رسائل من "اللاوعي الجمعي" تحتوي على رموز عالمية (Archetypes) تهدف إلى توجيه الفرد نحو التوازن النفسي والنمو الذاتي.
                                </p>
                            </div>
                        </div>

                        <div className="glass-card mb-3xl bg-[var(--color-bg-secondary)]" suppressHydrationWarning>
                            <h2 className="text-2xl font-bold mb-xl text-center">🔬 العلم الحديث والأحلام</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg" suppressHydrationWarning>
                                <div className="text-center" suppressHydrationWarning>
                                    <div className="text-3xl mb-sm">💾</div>
                                    <h4 className="font-bold mb-sm">معالجة الذاكرة</h4>
                                    <p className="text-sm text-muted">الدماغ يقوم بفرز وترتيب المعلومات والأحداث التي مر بها خلال اليوم، وتخزين المهم منها في الذاكرة طويلة المدى.</p>
                                </div>
                                <div className="text-center" suppressHydrationWarning>
                                    <div className="text-3xl mb-sm">🎭</div>
                                    <h4 className="font-bold mb-sm">التنظيم العاطفي</h4>
                                    <p className="text-sm text-muted">الأحلام تساعد في معالجة المشاعر المعقدة والتجارب المؤلمة في بيئة آمنة (الحلم) لتقليل حدتها النفسية.</p>
                                </div>
                                <div className="text-center" suppressHydrationWarning>
                                    <div className="text-3xl mb-sm">💡</div>
                                    <h4 className="font-bold mb-sm">حل المشكلات</h4>
                                    <p className="text-sm text-muted">العقل يواصل العمل على حل المشكلات المعقدة أثناء النوم، وكثير من الاكتشافات العلمية جاءت عبر الأحلام.</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-3xl" suppressHydrationWarning>
                            <h2 className="text-2xl font-bold mb-md">التكامل بين الدين والعلم</h2>
                            <p className="text-muted mb-lg" style={{ maxWidth: 700, margin: '0 auto 2rem' }}>
                                في "المُفسِّر"، نؤمن بأن التفسير الشرعي (الذي يهتم بالرموز والرسائل الروحية) لا يتعارض مع التفسير النفسي (الذي يهتم بحالة الرائي النفسية والشعورية). بل يكملان بعضهما لتقديم فهم شامل.
                            </p>
                            <Link href="/learn" className="btn btn-outline">
                                العودة لمكتبة التعلم
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
