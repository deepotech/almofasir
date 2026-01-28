/**
 * SEO Intro Component for Homepage
 * 80-120 words optimized for search engines
 */

export default function SEOIntro() {
    return (
        <section className="py-8 md:py-12 bg-[var(--color-bg-secondary)]/30">
            <div className="container max-w-4xl mx-auto px-4">
                <p className="text-center text-[var(--color-text-secondary)] leading-relaxed text-sm md:text-base">
                    مرحبًا بك في <strong className="text-[var(--color-primary-light)]">المفسر</strong>،
                    أكبر موقع عربي متخصص في <strong>تفسير الأحلام</strong> و<strong>تفسير الرؤى</strong> وفق المنهج الإسلامي المعتبر.
                    نقدم لك خدمة <strong>تفسير الأحلام بالذكاء الاصطناعي</strong> المستندة إلى منهج العلماء الكبار مثل
                    <strong> ابن سيرين</strong> و<strong>النابلسي</strong>، مع إمكانية التواصل مع مفسرين معتمدين للحصول على تفسير شخصي أعمق.
                    نؤكد أن التفسير اجتهادي وليس جزمًا بالغيب، ونحترم خصوصية جميع المستخدمين ولا ننشر الأحلام إلا بإذنهم.
                </p>
            </div>
        </section>
    );
}
