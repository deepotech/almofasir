'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <h1 className="mb-md">عن المُفسِّر</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                رحلة نحو فهم أعمق للذات من خلال نافذة الرؤى والأحلام.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl items-center mb-3xl" suppressHydrationWarning>
                            <div className="glass-card" suppressHydrationWarning>
                                <h2 className="text-2xl font-bold mb-md text-[var(--color-primary-light)]">من نحن؟</h2>
                                <p className="text-muted leading-relaxed mb-lg">
                                    "المُفسِّر" هي المنصة العربية الأولى التي تجمع بين أصالة التراث الإسلامي في تفسير الأحلام وقوة الذكاء الاصطناعي الحديث.
                                    نؤمن بأن الأحلام هي رسائل تحمل في طياتها حكماً وإشارات، ونسعى لتقديم أداة دقيقة وموثوقة تساعد المستخدمين على فك رموز هذه الرسائل.
                                </p>
                                <p className="text-muted leading-relaxed">
                                    تعتمد خوارزمياتنا على مؤلفات كبار المفسرين مثل ابن سيرين والنابلسي، مع مراعاة السياق الشخصي والنفسي لكل حالم، لتقديم تجربة تفسير فريدة وشاملة.
                                </p>
                            </div>
                            <div className="flex justify-center" suppressHydrationWarning>
                                <div className="text-[10rem]">🌙</div>
                            </div>
                        </div>

                        <div className="mb-3xl" suppressHydrationWarning>
                            <h2 className="text-2xl font-bold mb-xl text-center">قيمنا</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg" suppressHydrationWarning>
                                <div className="glass-card text-center" suppressHydrationWarning>
                                    <div className="text-4xl mb-md">🤝</div>
                                    <h3 className="font-bold mb-sm">الخصوصية والأمان</h3>
                                    <p className="text-muted text-sm">بياناتك وأحلامك مشفرة ومحمية بالكامل. نحن نحترم خصوصيتك ونعتبرها أولويتنا القصوى.</p>
                                </div>
                                <div className="glass-card text-center" suppressHydrationWarning>
                                    <div className="text-4xl mb-md">📚</div>
                                    <h3 className="font-bold mb-sm">الأصالة والمعرفة</h3>
                                    <p className="text-muted text-sm">لا نعتمد على العشوائية، بل نستند إلى مراجع علمية وتراثية موثقة في علم تعبير الرؤى.</p>
                                </div>
                                <div className="glass-card text-center" suppressHydrationWarning>
                                    <div className="text-4xl mb-md">🚀</div>
                                    <h3 className="font-bold mb-sm">السرعة والسهولة</h3>
                                    <p className="text-muted text-sm">احصل على تفسير حلمك في ثوانٍ معدودة، في أي وقت ومن أي مكان.</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center" suppressHydrationWarning>
                            <h2 className="text-2xl font-bold mb-md">انضم إلينا اليوم</h2>
                            <p className="text-muted mb-lg">اكتشف ما تخبئه لك أحلامك وابدأ رحلة الوعي.</p>
                            <a href="/" className="btn btn-primary">فسّر حلمك الآن</a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
