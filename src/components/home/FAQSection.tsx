'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: string;
    hasLink?: boolean;
}

const faqData: FAQItem[] = [
    {
        question: "كيف أبدأ بتفسير حلمي؟",
        answer: "دوّن حلمك فور الاستيقاظ مع مشاعرك، ثم استعِن بمفسر موثوق. التفسير يختلف باختلاف حال الرائي، لذا تجنّب التأويلات العامة.",
        hasLink: true
    },
    {
        question: "هل نهى الرسول ﷺ عن تفسير الأحلام؟",
        answer: "لم يَنهَ النبي ﷺ عن تفسير الرؤى، بل حذّر من التفسير بغير علم. الرؤيا تقع على ما تُعبَّر به، لذا يُستحب طلب التفسير من أهل الخبرة."
    },
    {
        question: "كيف أميّز بين الرؤيا الصادقة والحلم العادي؟",
        answer: "الرؤيا الصادقة غالبًا واضحة ومتماسكة، ويشعر صاحبها بوقع خاص في قلبه. أما الأحلام المشوشة فقد تكون من حديث النفس، ويُستحب الاستعاذة منها."
    },
    {
        question: "ما أفضل وقت تكون فيه الرؤيا أصدق؟",
        answer: "يُفهم من الآثار أن الثلث الأخير من الليل وقُبيل الفجر قد يكون أقرب للصدق، لكن الرؤيا الصادقة قد تأتي في أي وقت بإذن الله."
    },
    {
        question: "ما هو أندر أنواع الأحلام في الإسلام؟",
        answer: "أندرها الرؤيا الصالحة التي تتحقق كما رآها صاحبها، وهي جزء من النبوة كما في الحديث. كذلك رؤية الأنبياء من أنفَس ما يراه المؤمن."
    },
    {
        question: "كيف أعرف أن حلمي تحذير أو رسالة؟",
        answer: "أحلام التنبيه قد تتكرر أو تترك أثرًا عميقًا في النفس. إذا شعرت بدافع للتوبة أو قلق مستمر، فقد يكون مؤشرًا يستحق التأمل."
    },
    {
        question: "ما الأحلام التي لا ينبغي إخبار الآخرين بها؟",
        answer: "أوصى النبي ﷺ بألا يُخبَر بالحلم المكروه إلا لعالِم ناصح. كما يُستحب كتمان الرؤى الخاصة حتى لا تُفسَّر على غير وجهها."
    },
    {
        question: "كيف أفهم رموز حلمي ودلالاتها؟",
        answer: "فهم الرموز يتطلب ربطها بسياق حياتك ومشاعرك أثناء الحلم. الماء والنار والحيوانات لها دلالات متعددة تختلف حسب حال الرائي وتفاصيل المنام."
    }
];

// JSON-LD Schema for FAQ
const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
        }
    }))
};

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="section py-24" style={{ background: 'var(--color-bg-secondary)' }}>
            {/* JSON-LD Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="container max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        الأسئلة الشائعة حول تفسير الأحلام
                    </h2>
                    <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
                        إجابات موثوقة مستندة إلى المنهج الإسلامي في فهم الرؤى والأحلام
                    </p>
                </div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-xl overflow-hidden transition-all duration-300 hover:border-[var(--color-primary)]/50"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-5 text-right transition-colors hover:bg-white/5"
                                aria-expanded={openIndex === index}
                            >
                                <h3 className="text-base md:text-lg font-semibold text-white pr-0 pl-4 flex-1 text-right">
                                    {faq.question}
                                </h3>
                                <span
                                    className={`text-[var(--color-primary)] text-xl transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                >
                                    ▼
                                </span>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-5 pb-5 text-[var(--color-text-secondary)] leading-relaxed text-sm md:text-base">
                                    <p>{faq.answer}</p>
                                    {faq.hasLink && (
                                        <button
                                            className="inline-block mt-3 text-[var(--color-primary-light)] hover:text-[var(--color-primary)] text-sm font-medium transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            👈 فسّر حلمك الآن مجانًا
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Enhanced Trust Indicator (EEAT) */}
                <div className="mt-10 text-center">
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-xl mx-auto">
                        📖 المحتوى مستند إلى مصادر إسلامية معتبرة، ويُقدَّم لأغراض الفهم والتدبر دون الجزم بعلم الغيب. نحترم خصوصية كل رائي ولا ننشر البيانات الشخصية.
                    </p>
                </div>
            </div>
        </section>
    );
}
