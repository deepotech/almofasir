'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <h1 className="mb-md">شروط الاستخدام</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                آخر تحديث: 4 يناير 2026
                            </p>
                        </div>

                        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto' }} suppressHydrationWarning>
                            <div className="prose text-right" suppressHydrationWarning>
                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">1. قبول الشروط</h3>
                                <p className="mb-lg text-muted">
                                    باستخدامك لمنصة "المُفسِّر"، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الموقع.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">2. طبيعة الخدمة (إخلاء المسؤولية)</h3>
                                <p className="mb-lg text-muted">
                                    خدمة تفسير الأحلام المقدمة عبر هذا الموقع (سواء الآلية أو البشرية) هي لأغراض الاستئناس، الترفيه، والتوجيه الروحي فقط.
                                </p>
                                <ul className="list-disc list-inside mb-lg text-muted space-y-sm">
                                    <li>التفسيرات ليست نصائح طبية، نفسية، قانونية، أو مالية معتمدة.</li>
                                    <li>لا يجب اتخاذ قرارات مصيرية بناءً على تفسير حلم.</li>
                                    <li>نحن لا نضمن دقة أو تحقق التفسيرات، حيث أن الرؤى ظنية ولا يعلم الغيب إلا الله.</li>
                                </ul>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">3. سلوك المستخدم</h3>
                                <p className="mb-lg text-muted">
                                    تتعهد باستخدام الموقع لأغراض مشروعة، وتمتنع عن:
                                </p>
                                <ul className="list-disc list-inside mb-lg text-muted space-y-sm">
                                    <li>إرسال أحلام تحتوي على محتوى مسيء، عنيف، أو غير أخلاقي.</li>
                                    <li>انتحال شخصية الآخرين أو تقديم معلومات كاذبة.</li>
                                    <li>محاولة اختراق الموقع أو تعطيل خدماته.</li>
                                </ul>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">4. الملكية الفكرية</h3>
                                <p className="mb-lg text-muted">
                                    جميع المحتويات الموجودة على هذا الموقع (النصوص، التصاميم، الشعارات، والبرمجيات) هي ملك لمنصة "المُفسِّر" ومحمية بموجب قوانين الملكية الفكرية. يمنع نسخ أو إعادة نشر أي جزء من الموقع دون إذن كتابي مسبق.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">5. حدود المسؤولية</h3>
                                <p className="mb-lg text-muted">
                                    منصة "المُفسِّر" وفريق العمل غير مسؤولين عن أي أضرار مباشرة أو غير مباشرة قد تنشأ عن استخدامك للموقع أو اعتمادك على المعلومات المقدمة فيه.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">6. التعديلات</h3>
                                <p className="mb-lg text-muted">
                                    نحتفظ بالحق في تعديل شروط الاستخدام هذه في أي وقت. سيتم نشر التعديلات على هذه الصفحة، ويعتبر استمرارك في استخدام الموقع قبولاً للشروط المعدلة.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">7. اتصل بنا</h3>
                                <p className="mb-lg text-muted">
                                    لأي استفسارات بخصوص شروط الاستخدام، يرجى التواصل معنا عبر صفحة <a href="/contact" className="text-[var(--color-gold)]">اتصل بنا</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
