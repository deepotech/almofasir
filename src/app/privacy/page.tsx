'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100, minHeight: '100vh' }}>
                <section className="section">
                    <div className="container" suppressHydrationWarning>
                        <div className="text-center mb-2xl" suppressHydrationWarning>
                            <h1 className="mb-md">سياسة الخصوصية</h1>
                            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                                آخر تحديث: 4 يناير 2026
                            </p>
                        </div>

                        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto' }} suppressHydrationWarning>
                            <div className="prose text-right" suppressHydrationWarning>
                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">1. مقدمة</h3>
                                <p className="mb-lg text-muted">
                                    أهلاً بك في منصة "المُفسِّر". نحن نولي خصوصية بياناتك أهمية قصوى. تشرح وثيقة سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية وتفاصيل أحلامك عند استخدامك لموقعنا.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">2. المعلومات التي نجمعها</h3>
                                <ul className="list-disc list-inside mb-lg text-muted space-y-sm">
                                    <li><strong>معلومات الحساب:</strong> مثل الاسم، البريد الإلكتروني، والصورة الشخصية عند التسجيل.</li>
                                    <li><strong>بيانات الأحلام:</strong> نصوص الأحلام التي تقوم بإدخالها للتفسير، والسياق المرافق لها (مثل الحالة الاجتماعية، الشعور، وغيرها).</li>
                                    <li><strong>بيانات الاستخدام:</strong> معلومات حول كيفية تفاعلك مع الموقع لتحسين تجربة المستخدم.</li>
                                </ul>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">3. كيف نستخدم معلوماتك</h3>
                                <p className="mb-lg text-muted">
                                    نستخدم البيانات التي نجمعها للأغراض التالية:
                                </p>
                                <ul className="list-disc list-inside mb-lg text-muted space-y-sm">
                                    <li>تقديم خدمات تفسير الأحلام باستخدام الذكاء الاصطناعي.</li>
                                    <li>تحسين دقة التفسيرات وتخصيصها بناءً على سياقك الشخصي.</li>
                                    <li>التواصل معك بخصوص تحديثات الخدمة أو الرد على استفساراتك.</li>
                                </ul>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">4. مشاركة البيانات</h3>
                                <p className="mb-lg text-muted">
                                    نحن لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بيانات الأحلام (بشكل مجهول) مع مزودي خدمات الذكاء الاصطناعي لمعالجتها والحصول على التفسير، مع ضمان عدم مشاركة معلومات تحدد هويتك الشخصية في هذا السياق.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">5. أمن البيانات</h3>
                                <p className="mb-lg text-muted">
                                    نحن نتخذ تدابير أمنية تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">6. حقوقك</h3>
                                <p className="mb-lg text-muted">
                                    لديك الحق في طلب الوصول إلى بياناتك الشخصية التي نحتفظ بها، أو تصحيحها، أو حذفها. يمكنك القيام بذلك من خلال إعدادات حسابك أو بالتواصل معنا مباشرة.
                                </p>

                                <h3 className="text-xl font-bold mb-md text-[var(--color-primary-light)]">7. اتصل بنا</h3>
                                <p className="mb-lg text-muted">
                                    إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر صفحة <a href="/contact" className="text-[var(--color-gold)]">اتصل بنا</a>.
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
