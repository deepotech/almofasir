/**
 * Schema.org JSON-LD builders for SEO
 * All schemas follow https://schema.org specifications
 */

const BASE_URL = 'https://almofasir.com';
const SITE_NAME = 'المُفسِّر';
const SITE_NAME_EN = 'Almofasir';

// Types
export interface FAQItem {
    question: string;
    answer: string;
}

export interface ArticleData {
    title: string;
    description: string;
    url: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    image?: string;
}

// ============================================
// FAQPage Schema Builder
// ============================================
export function buildFAQSchema(items: FAQItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": items.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };
}

// ============================================
// WebSite Schema Builder (with SearchAction)
// ============================================
export function buildWebSiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": `${SITE_NAME} - تفسير الأحلام`,
        "alternateName": `${SITE_NAME_EN} Dream Interpretation`,
        "url": BASE_URL,
        "description": "موقع تفسير الأحلام مجاناً بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
        "inLanguage": "ar",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${BASE_URL}/symbols?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": `${BASE_URL}/logo.png`
            }
        }
    };
}

// ============================================
// Organization Schema Builder
// ============================================
export function buildOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": SITE_NAME,
        "alternateName": SITE_NAME_EN,
        "url": BASE_URL,
        "logo": `${BASE_URL}/logo.png`,
        "description": "منصة المفسر لتفسير الأحلام بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
        "sameAs": [
            "https://twitter.com/almofasir",
            "https://facebook.com/almofasir"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": ["Arabic", "English"]
        }
    };
}

// ============================================
// WebPage Schema Builder
// ============================================
export function buildWebPageSchema(title: string, description: string, url: string) {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": url,
        "inLanguage": "ar",
        "isPartOf": {
            "@type": "WebSite",
            "name": SITE_NAME,
            "url": BASE_URL
        },
        "about": {
            "@type": "Thing",
            "name": "تفسير الأحلام"
        },
        "mentions": [
            { "@type": "Person", "name": "ابن سيرين" },
            { "@type": "Person", "name": "النابلسي" }
        ]
    };
}

// ============================================
// Article Schema Builder (for Pillar/Blog pages)
// ============================================
export function buildArticleSchema(data: ArticleData) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title,
        "description": data.description,
        "url": data.url,
        "datePublished": data.datePublished,
        "dateModified": data.dateModified || data.datePublished,
        "author": {
            "@type": "Person",
            "name": data.author || "المُفسِّر"
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": `${BASE_URL}/logo.png`
            }
        },
        "image": data.image || `${BASE_URL}/og-image.jpg`,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
        },
        "inLanguage": "ar"
    };
}

// ============================================
// Combined Homepage Schema
// ============================================
export function buildHomePageSchemas(faqItems?: FAQItem[]): object[] {
    const schemas: object[] = [
        buildOrganizationSchema(),
        buildWebSiteSchema(),
        buildWebPageSchema(
            "تفسير الأحلام مجاناً | المفسر",
            "اكتب حلمك واحصل على تفسير فوري بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
            BASE_URL
        )
    ];

    if (faqItems && faqItems.length > 0) {
        schemas.push(buildFAQSchema(faqItems));
    }

    return schemas;
}

// ============================================
// Render Schema as JSON-LD Script Tag Content
// ============================================
export function renderSchemaScript(schema: object | object[]): string {
    return JSON.stringify(schema);
}
