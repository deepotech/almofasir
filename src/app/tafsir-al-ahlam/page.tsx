import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';
import { buildArticleSchema, buildFAQSchema, FAQItem } from '@/lib/schema';

// Metadata
export const metadata: Metadata = {
    title: 'تفسير الأحلام في الإسلام | دليل شامل لفهم الرؤى والأحلام - المفسر',
    description: 'دليل شامل لتفسير الأحلام في الإسلام وفق منهج ابن سيرين والنابلسي. تعرف على الفرق بين الرؤيا والحلم، أنواع الأحلام، وآداب التفسير الصحيحة.',
    keywords: 'تفسير الأحلام, تفسير الرؤى, ابن سيرين, النابلسي, تفسير الأحلام في الإسلام, أنواع الأحلام, الرؤيا الصادقة, تفسير الأحلام بالقرآن',
    alternates: {
        canonical: 'https://almofasir.com/tafsir-al-ahlam',
    },
    openGraph: {
        title: 'تفسير الأحلام في الإسلام | دليل شامل - المفسر',
        description: 'دليل شامل لتفسير الأحلام في الإسلام وفق منهج ابن سيرين والنابلسي.',
        url: 'https://almofasir.com/tafsir-al-ahlam',
        type: 'article',
    },
};

// FAQ data for this page
const pageFAQ: FAQItem[] = [
    {
        question: "ما الفرق بين الرؤيا والحلم في الإسلام؟",
        answer: "الرؤيا من الله وتكون صادقة وواضحة، بينما الحلم من الشيطان أو حديث النفس ويكون غالبًا مشوشًا أو مخيفًا. الرؤيا تستحق التفسير، أما الحلم السيء فيُستحب الاستعاذة منه."
    },
    {
        question: "هل يجب تفسير كل حلم أراه؟",
        answer: "ليس كل حلم يستحق التفسير. الأحلام المشوشة أو المخيفة قد تكون من الشيطان، ويُستحب الاستعاذة منها وعدم الانشغال بها. أما الرؤى الواضحة ذات الأثر النفسي فتستحق التفسير."
    },
    {
        question: "لمن أحكي رؤياي للتفسير؟",
        answer: "يُستحب أن تحكي رؤياك لعالِم أو مفسر موثوق، أو لمحب ناصح. ورد في الحديث أن الرؤيا تقع على ما تُعبَّر به، لذا احرص على اختيار المفسر الأمين."
    },
    {
        question: "هل تفسير الأحلام بالذكاء الاصطناعي مقبول شرعًا؟",
        answer: "التفسير بالذكاء الاصطناعي يعتمد على قواعد المفسرين الكلاسيكيين ويُستخدم للاستئناس وليس للجزم. للتفسير الأدق في الأمور المهمة، يُنصح بالتواصل مع مفسر متخصص."
    }
];

// Table of contents
const tableOfContents = [
    { id: 'introduction', title: 'مقدمة عن تفسير الأحلام' },
    { id: 'difference', title: 'الفرق بين الرؤيا والحلم' },
    { id: 'types', title: 'أنواع الأحلام في الإسلام' },
    { id: 'ibn-sirin', title: 'منهج ابن سيرين في التفسير' },
    { id: 'nabulsi', title: 'منهج النابلسي في التفسير' },
    { id: 'etiquette', title: 'آداب تفسير الأحلام' },
    { id: 'ai-interpretation', title: 'التفسير بالذكاء الاصطناعي' },
    { id: 'faq', title: 'الأسئلة الشائعة' },
];

export default function TafsirAlAhlamPage() {
    // Schemas
    const articleSchema = buildArticleSchema({
        title: 'تفسير الأحلام في الإسلام | دليل شامل لفهم الرؤى والأحلام',
        description: 'دليل شامل لتفسير الأحلام في الإسلام وفق منهج ابن سيرين والنابلسي.',
        url: 'https://almofasir.com/tafsir-al-ahlam',
        datePublished: '2024-01-01',
        dateModified: new Date().toISOString().split('T')[0],
    });

    const faqSchema = buildFAQSchema(pageFAQ);

    return (
        <>
            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <Header />
            <main className="min-h-screen pt-24 pb-16">
                <article className="container mx-auto px-4 max-w-4xl">

                    {/* Hero */}
                    <header className="text-center mb-12">
                        <span className="tag mb-4 bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] border-[var(--color-primary)]/50">
                            دليل شامل
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            <span className="text-gradient">تفسير الأحلام في الإسلام</span>
                            <br />
                            <span className="text-xl md:text-2xl text-[var(--color-text-secondary)] mt-4 block font-normal">
                                دليلك الشامل لفهم الرؤى والأحلام وفق المنهج الإسلامي
                            </span>
                        </h1>
                        <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
                            تعرّف على أصول تفسير الأحلام في الإسلام، ومناهج كبار المفسرين كابن سيرين والنابلسي،
                            وكيف يمكنك فهم رؤاك بطريقة صحيحة ومتوازنة.
                        </p>
                    </header>

                    {/* Table of Contents */}
                    <nav className="glass-card p-6 mb-12 border border-[var(--color-border)]" aria-label="جدول المحتويات">
                        <h2 className="text-lg font-bold mb-4 text-[var(--color-primary-light)]">📑 جدول المحتويات</h2>
                        <ol className="space-y-2 list-decimal list-inside text-[var(--color-text-secondary)]">
                            {tableOfContents.map((item) => (
                                <li key={item.id}>
                                    <a href={`#${item.id}`} className="hover:text-[var(--color-primary)] transition-colors">
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    {/* Content Sections */}
                    <div className="prose prose-lg prose-invert max-w-none space-y-12">

                        {/* Introduction */}
                        <section id="introduction">
                            <h2 className="text-2xl font-bold mb-4 text-white">مقدمة عن تفسير الأحلام</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                تفسير الأحلام علم قديم له جذوره في الثقافات الإنسانية المختلفة، لكنه احتل مكانة خاصة في الإسلام
                                حيث ورد ذكر الرؤى في القرآن الكريم في عدة مواضع، أبرزها رؤيا سيدنا يوسف عليه السلام
                                وتأويله لرؤى الملك. قال تعالى: ﴿إِذْ قَالَ يُوسُفُ لِأَبِيهِ يَا أَبَتِ إِنِّي رَأَيْتُ أَحَدَ عَشَرَ كَوْكَبًا وَالشَّمْسَ وَالْقَمَرَ رَأَيْتُهُمْ لِي سَاجِدِينَ﴾.
                            </p>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                وفي الحديث الشريف: «الرُّؤْيَا الصَّالِحَةُ مِنَ اللهِ، وَالحُلْمُ مِنَ الشَّيْطَانِ» (رواه البخاري ومسلم)،
                                مما يؤكد أن للأحلام مصادر متعددة ومعانٍ مختلفة تستحق التأمل والتفسير السليم.
                            </p>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                نؤكد أن تفسير الأحلام اجتهادي وليس علمًا قاطعًا، ولا أحد يعلم الغيب إلا الله.
                                التفسير هو محاولة لفهم الرموز والإشارات، مع ضرورة عدم الجزم أو بناء قرارات مصيرية على الأحلام وحدها.
                            </p>
                        </section>

                        {/* Difference between Ru'ya and Hulm */}
                        <section id="difference">
                            <h2 className="text-2xl font-bold mb-4 text-white">الفرق بين الرؤيا والحلم</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                في التراث الإسلامي، يُفرَّق بين ثلاثة أنواع من المرائي التي يراها النائم:
                            </p>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="glass-card p-4 border border-green-500/30">
                                    <h3 className="font-bold text-green-400 mb-2">🌙 الرؤيا الصادقة</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        من الله تعالى، تكون واضحة ومتماسكة، قد تحمل بشارة أو إنذارًا، وتترك أثرًا إيجابيًا في النفس.
                                    </p>
                                </div>
                                <div className="glass-card p-4 border border-red-500/30">
                                    <h3 className="font-bold text-red-400 mb-2">😈 الحلم من الشيطان</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        يكون مخيفًا أو مزعجًا، هدفه إحزان المؤمن. يُستحب الاستعاذة منه والتفل عن اليسار ثلاثًا.
                                    </p>
                                </div>
                                <div className="glass-card p-4 border border-gray-500/30">
                                    <h3 className="font-bold text-gray-400 mb-2">💭 حديث النفس</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        انعكاس للهموم والأفكار اليومية، لا معنى له غالبًا ولا يستحق التفسير.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Types of Dreams */}
                        <section id="types">
                            <h2 className="text-2xl font-bold mb-4 text-white">أنواع الأحلام في الإسلام</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                تتعدد أنواع الأحلام بحسب مصدرها ومحتواها وتأثيرها على الرائي:
                            </p>
                            <ul className="space-y-3 text-[var(--color-text-secondary)]">
                                <li className="flex gap-3">
                                    <span className="text-[var(--color-gold)]">✦</span>
                                    <span><strong>الرؤيا الصالحة:</strong> جزء من ستة وأربعين جزءًا من النبوة كما في الحديث، وهي أندر الأحلام وأصدقها.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[var(--color-gold)]">✦</span>
                                    <span><strong>رؤيا البشارة:</strong> تحمل خيرًا للرائي في دينه أو دنياه، ويُستحب حمد الله عليها.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[var(--color-gold)]">✦</span>
                                    <span><strong>رؤيا التحذير:</strong> تنبيه من الله لعبده ليستدرك أمرًا أو يتوب من ذنب.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[var(--color-gold)]">✦</span>
                                    <span><strong>الأحلام المتكررة:</strong> قد تشير إلى أمر مهم يستحق الانتباه والتأمل.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[var(--color-gold)]">✦</span>
                                    <span><strong>أضغاث الأحلام:</strong> أحلام مشوشة لا رابط بينها، غالبًا من حديث النفس أو تأثير الطعام.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Ibn Sirin's Method */}
                        <section id="ibn-sirin">
                            <h2 className="text-2xl font-bold mb-4 text-white">منهج ابن سيرين في التفسير</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                يُعدّ الإمام محمد بن سيرين (ت. 110هـ) من أشهر مفسري الأحلام في التاريخ الإسلامي.
                                اشتهر بدقته وورعه، وكان يسأل الرائي عن حاله وظروفه قبل التفسير.
                            </p>
                            <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] mb-4">
                                <h3 className="font-bold text-[var(--color-primary-light)] mb-3">أسس منهج ابن سيرين:</h3>
                                <ul className="space-y-2 text-[var(--color-text-secondary)]">
                                    <li>• الاستناد إلى القرآن الكريم والسنة النبوية في تأويل الرموز</li>
                                    <li>• مراعاة حال الرائي (صلاحه، مهنته، ظروفه الاجتماعية)</li>
                                    <li>• استخدام اللغة العربية وجذور الألفاظ في التفسير</li>
                                    <li>• عدم الجزم في التفسير والتواضع أمام علم الله</li>
                                </ul>
                            </div>
                            <p className="text-[var(--color-text-muted)] text-sm">
                                من أشهر أقواله: "إني لأكره أن أقول للرجل: رأيت كذا وكذا، لأن الرؤيا على ما تُعبَّر".
                            </p>
                        </section>

                        {/* Nabulsi's Method */}
                        <section id="nabulsi">
                            <h2 className="text-2xl font-bold mb-4 text-white">منهج النابلسي في التفسير</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                الشيخ عبد الغني النابلسي (ت. 1143هـ) عالم صوفي ومفسر أحلام شهير، ألّف موسوعة
                                "تعطير الأنام في تعبير المنام" التي تُعدّ من أشمل كتب تفسير الأحلام.
                            </p>
                            <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border)] mb-4">
                                <h3 className="font-bold text-[var(--color-secondary)] mb-3">ميزات منهج النابلسي:</h3>
                                <ul className="space-y-2 text-[var(--color-text-secondary)]">
                                    <li>• تصنيف الرموز أبجديًا لسهولة البحث</li>
                                    <li>• الجمع بين المنهج الشرعي والذوق الصوفي</li>
                                    <li>• التوسع في ذكر الاحتمالات المختلفة للرمز الواحد</li>
                                    <li>• ربط التفسير بالسياق الثقافي والاجتماعي</li>
                                </ul>
                            </div>
                        </section>

                        {/* Etiquette */}
                        <section id="etiquette">
                            <h2 className="text-2xl font-bold mb-4 text-white">آداب تفسير الأحلام</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                للتعامل مع الأحلام آداب شرعية ينبغي مراعاتها:
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-bold">1</span>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">عند الرؤيا الحسنة</h3>
                                        <p className="text-[var(--color-text-muted)] text-sm">احمد الله عليها، ولا تحدّث بها إلا من تحب، واستبشر خيرًا.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm font-bold">2</span>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">عند الحلم السيء</h3>
                                        <p className="text-[var(--color-text-muted)] text-sm">استعذ بالله من الشيطان، اتفل عن يسارك ثلاثًا، غيّر جنبك، ولا تحدّث به أحدًا.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm font-bold">3</span>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">اختيار المفسر</h3>
                                        <p className="text-[var(--color-text-muted)] text-sm">اختر مفسرًا موثوقًا وعالمًا، وتجنب من يفسر بلا علم أو يستغل الناس.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-sm font-bold">4</span>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">عدم الجزم</h3>
                                        <p className="text-[var(--color-text-muted)] text-sm">التفسير اجتهادي، فلا تبنِ قرارات مصيرية على حلم، ولا تحزن من تفسير سلبي.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* AI Interpretation */}
                        <section id="ai-interpretation">
                            <h2 className="text-2xl font-bold mb-4 text-white">التفسير بالذكاء الاصطناعي</h2>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                في موقع المفسر، نقدم خدمة تفسير الأحلام بالذكاء الاصطناعي المبنية على قواعد ومنهجية
                                المفسرين الكلاسيكيين مثل ابن سيرين والنابلسي. هذه الخدمة:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="glass-card p-4">
                                    <h3 className="font-bold text-[var(--color-primary-light)] mb-2">✅ مميزات التفسير الآلي</h3>
                                    <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                                        <li>• سرعة فورية (ثوانٍ معدودة)</li>
                                        <li>• متاح على مدار الساعة</li>
                                        <li>• مجاني (مع عدد محدود يوميًا)</li>
                                        <li>• خصوصية تامة</li>
                                    </ul>
                                </div>
                                <div className="glass-card p-4">
                                    <h3 className="font-bold text-[var(--color-secondary)] mb-2">👨‍⚖️ متى تحتاج مفسرًا بشريًا؟</h3>
                                    <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                                        <li>• الرؤى المعقدة أو المتكررة</li>
                                        <li>• الحاجة للسؤال والتفاعل</li>
                                        <li>• الرغبة في فهم أعمق للسياق الشخصي</li>
                                        <li>• الطمأنينة القلبية</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 text-center">
                                <p className="text-amber-200 text-sm mb-3">
                                    نؤكد أن التفسير الآلي للاستئناس وليس للجزم، ولا يُغني عن استشارة العلماء في الأمور المهمة.
                                </p>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section id="faq">
                            <h2 className="text-2xl font-bold mb-6 text-white">الأسئلة الشائعة</h2>
                            <div className="space-y-4">
                                {pageFAQ.map((item, index) => (
                                    <div key={index} className="glass-card p-5 border border-[var(--color-border)]">
                                        <h3 className="font-bold text-[var(--color-primary-light)] mb-2">{item.question}</h3>
                                        <p className="text-[var(--color-text-secondary)] text-sm">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* CTA */}
                    <div className="mt-16 text-center bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] p-12 rounded-3xl border border-[var(--color-border)]">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">هل لديك حلم تريد تفسيره؟</h2>
                        <p className="text-[var(--color-text-muted)] mb-8 max-w-xl mx-auto">
                            جرّب خدمة التفسير المجاني بالذكاء الاصطناعي، أو تواصل مع مفسرينا المعتمدين للحصول على تفسير شخصي.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/" className="btn btn-primary btn-lg">
                                فسّر حلمك الآن مجانًا
                            </Link>
                            <Link href="/experts" className="btn btn-outline btn-lg">
                                تصفح المفسرين المعتمدين
                            </Link>
                        </div>
                    </div>

                </article>
            </main>
            <Footer />
        </>
    );
}
