'use client';

interface JsonLdScriptProps {
    type?: 'organization' | 'website' | 'faq' | 'article';
    data?: Record<string, unknown>;
}

export default function JsonLdScript({ type = 'organization' }: JsonLdScriptProps) {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "المُفسِّر",
        "alternateName": "Almofasser",
        "url": "https://almofasser.com",
        "logo": "https://almofasser.com/logo.png",
        "description": "منصة المفسر لتفسير الأحلام بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
        "sameAs": [
            "https://twitter.com/almofasser",
            "https://facebook.com/almofasser"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+966-XXX-XXXX",
            "contactType": "customer service",
            "availableLanguage": ["Arabic", "English"]
        }
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "المُفسِّر - تفسير الأحلام",
        "alternateName": "Almofasser Dream Interpretation",
        "url": "https://almofasser.com",
        "description": "موقع تفسير الأحلام مجاناً بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
        "inLanguage": "ar",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://almofasser.com/symbols?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        },
        "publisher": {
            "@type": "Organization",
            "name": "المُفسِّر",
            "logo": {
                "@type": "ImageObject",
                "url": "https://almofasser.com/logo.png"
            }
        }
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "ما هو الفرق بين الرؤيا والحلم؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "الرؤيا من الله وهي صادقة، أما الحلم فمن الشيطان أو حديث النفس. الرؤيا غالباً تكون واضحة ومتماسكة، بينما الحلم مشوش ومخيف."
                }
            },
            {
                "@type": "Question",
                "name": "هل تفسير الأحلام بالذكاء الاصطناعي دقيق؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "التفسير بالذكاء الاصطناعي يعتمد على قواعد المفسرين الكلاسيكيين مثل ابن سيرين والنابلسي، وهو للاستئناس وليس حكماً قاطعاً. للتفسير الأدق، ننصح بالتواصل مع مفسر معتمد."
                }
            },
            {
                "@type": "Question",
                "name": "كيف أفسر حلمي مجاناً؟",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يمكنك كتابة حلمك في صندوق الإدخال على الصفحة الرئيسية، واختيار المفسر المناسب، ثم الضغط على زر 'فسّر حلمي' للحصول على تفسير فوري مجاني."
                }
            }
        ]
    };

    const getSchema = () => {
        switch (type) {
            case 'organization':
                return organizationSchema;
            case 'website':
                return websiteSchema;
            case 'faq':
                return faqSchema;
            default:
                return organizationSchema;
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }}
        />
    );
}

// Combined schema for homepage
export function HomePageJsonLd() {
    const combinedSchema = [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "المُفسِّر",
            "alternateName": "Almofasser",
            "url": "https://almofasser.com",
            "logo": "https://almofasser.com/logo.png",
            "description": "منصة المفسر لتفسير الأحلام بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي"
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "المُفسِّر - تفسير الأحلام",
            "url": "https://almofasser.com",
            "inLanguage": "ar",
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://almofasser.com/symbols?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "تفسير الأحلام مجاناً | المفسر",
            "description": "اكتب حلمك واحصل على تفسير فوري بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
            "url": "https://almofasser.com",
            "inLanguage": "ar",
            "isPartOf": {
                "@type": "WebSite",
                "name": "المُفسِّر",
                "url": "https://almofasser.com"
            },
            "about": {
                "@type": "Thing",
                "name": "تفسير الأحلام"
            },
            "mentions": [
                { "@type": "Person", "name": "ابن سيرين" },
                { "@type": "Person", "name": "النابلسي" }
            ]
        }
    ];

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
        />
    );
}
