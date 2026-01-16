import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
    title: 'تفسير الأحلام من مفسرين حقيقيين – عندما لا يكفي الذكاء الاصطناعي | المفسر',
    description: 'خدمة تفسير أحلام خاصة وسرية مع مفسرين حقيقين معتمدين. احصل على استشارة دقيقة لحلمك عندما تحتاج لأكثر من مجرد تحليل آلي.',
};

export default function HumanInterpretationPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-4">

                    {/* Hero Section */}
                    <section className="text-center mb-20">
                        <span className="tag mb-4 bg-amber-900/40 text-amber-200 border-amber-700/50">خدمة مميزة</span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            <span className="text-gradient">تفسير الأحلام من مفسرين حقيقيين</span>
                            <br />
                            <span className="text-2xl md:text-4xl text-[var(--color-text-secondary)] mt-4 block">
                                عندما لا يكفي الذكاء الاصطناعي
                            </span>
                        </h1>
                        <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed mb-8">
                            الذكاء الاصطناعي مذهل، ولكن بعض الرؤى تحمل رسائل عميقة ومعقدة تحتاج إلى بصيرة المؤمن وخبرة العالم.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button className="btn btn-primary btn-lg shine-effect">
                                📞 تواصل مع مفسر الآن
                            </button>
                        </div>
                    </section>

                    {/* Comparison Section */}
                    <section className="max-w-4xl mx-auto mb-20 animate-fadeInUp">
                        <div className="glass-card p-8 border border-[var(--color-border)]">
                            <h2 className="text-2xl font-bold mb-8 text-center">لماذا تختار المفسر البشري؟</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-[var(--color-primary)] mb-4">🤖 الذكاء الاصطناعي</h3>
                                    <ul className="space-y-3 text-[var(--color-text-secondary)]">
                                        <li className="flex items-center gap-2">✅ سرعة فورية (خلال ثوانٍ)</li>
                                        <li className="flex items-center gap-2">✅ تحليل ممتاز للرموز الشائعة</li>
                                        <li className="flex items-center gap-2">✅ متاح 24/7 مجاناً</li>
                                        <li className="flex items-center gap-2 opacity-50">❌ يفتقد "الفراسة" والبعد الروحي</li>
                                        <li className="flex items-center gap-2 opacity-50">❌ قد لا يربط الرموز بسياقك الخاص جداً</li>
                                    </ul>
                                </div>
                                <div className="space-y-4 border-r border-gray-700/30 pr-0 md:pr-8">
                                    <h3 className="text-xl font-bold text-[var(--color-gold)] mb-4">👨‍⚖️ المفسر الحقيقي</h3>
                                    <ul className="space-y-3 text-[var(--color-text-primary)]">
                                        <li className="flex items-center gap-2">💎 فهم عميق للسياق الشخصي والروحي</li>
                                        <li className="flex items-center gap-2">💎 الاستئناس بالرؤيا وتوجيه النصيحة</li>
                                        <li className="flex items-center gap-2">💎 التفاعل وسؤال الرائي عن تفاصيل دقيقة</li>
                                        <li className="flex items-center gap-2">💎 الطمأنينة القلبية</li>
                                        <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">⏳ يستغرق وقتاً أطول (حسب الموعد)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Expert Showcase (Mock) */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-center mb-12">نخبة من المفسرين المعتمدين</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1 */}
                            <div className="glass-card p-6 text-center hover:border-[var(--color-gold)] transition-colors cursor-pointer group">
                                <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 border-2 border-[var(--color-gold)] overflow-hidden">
                                    {/* Placeholder Image */}
                                    <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-3xl">👤</div>
                                </div>
                                <h3 className="text-xl font-bold mb-1">الشيخ أبو عبد الرحمن</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">متخصص في الرؤى الشرعية • خبرة 15 سنة</p>
                                <div className="flex justify-center gap-1 mb-4 text-amber-400">★★★★★ (4.9)</div>
                                <Link href="/booking" className="btn btn-outline btn-sm w-full group-hover:bg-[var(--color-gold)] group-hover:text-black group-hover:border-[var(--color-gold)]">
                                    حجز موعد
                                </Link>
                            </div>
                            {/* Card 2 */}
                            <div className="glass-card p-6 text-center hover:border-[var(--color-gold)] transition-colors cursor-pointer group">
                                <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 border-2 border-[var(--color-gold)] overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-3xl">👤</div>
                                </div>
                                <h3 className="text-xl font-bold mb-1">د. محمد القحطاني</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">دكتوراه في علم النفس • تفسير تحليلي</p>
                                <div className="flex justify-center gap-1 mb-4 text-amber-400">★★★★☆ (4.8)</div>
                                <Link href="/booking" className="btn btn-outline btn-sm w-full group-hover:bg-[var(--color-gold)] group-hover:text-black group-hover:border-[var(--color-gold)]">
                                    حجز موعد
                                </Link>
                            </div>
                            {/* Card 3 */}
                            <div className="glass-card p-6 text-center hover:border-[var(--color-gold)] transition-colors cursor-pointer group">
                                <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 border-2 border-[var(--color-gold)] overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-3xl">👤</div>
                                </div>
                                <h3 className="text-xl font-bold mb-1">الشيخة أم عمر</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">تفسير أحلام النساء • استشارات أسرية</p>
                                <div className="flex justify-center gap-1 mb-4 text-amber-400">★★★★★ (5.0)</div>
                                <Link href="/booking" className="btn btn-outline btn-sm w-full group-hover:bg-[var(--color-gold)] group-hover:text-black group-hover:border-[var(--color-gold)]">
                                    حجز موعد
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <div className="text-center bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] p-12 rounded-3xl border border-[var(--color-border)]">
                        <h2 className="text-3xl font-bold mb-4">هل أنت محتار في أمر رؤياك؟</h2>
                        <p className="text-xl text-[var(--color-text-muted)] mb-8">
                            لا تترك الشك يساورك. تواصل معنا الآن لنربطك بأهل الاختصاص.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/booking" className="btn btn-primary btn-lg">احجز جلستك الآن</Link>
                            <Link href="/" className="btn btn-ghost btn-lg">جرب التفسير الآلي أولاً</Link>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </>
    );
}
