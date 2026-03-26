/**
 * SEO Helpers - JSON-LD Schema Generation
 * Domain: https://almofasir.com (canonical)
 */

const SITE_URL = 'https://almofasir.com';
const SITE_NAME = 'المُفسِّر';
const LOGO_URL = `${SITE_URL}/logo.png`;

export interface ArticleSchemaData {
    title: string;
    description: string;
    url: string;
    datePublished: string;
    dateModified?: string;
    tags?: string[];
    imageUrl?: string;
}

/**
 * Generate Article JSON-LD Schema for dream interpretation pages
 */
export function generateArticleSchema(data: ArticleSchemaData): object {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title,
        "description": data.description,
        "url": data.url,
        "datePublished": data.datePublished,
        "dateModified": data.dateModified || data.datePublished,
        "author": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL
        },
        "publisher": {
            "@type": "Organization",
            "name": `${SITE_NAME} - منصة تفسير الأحلام`,
            "url": SITE_URL,
            "logo": {
                "@type": "ImageObject",
                "url": LOGO_URL
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
        },
        "articleSection": "تفسير الأحلام",
        "inLanguage": "ar",
        ...(data.tags && data.tags.length > 0 && {
            "keywords": data.tags.join(", ")
        }),
        ...(data.imageUrl && {
            "image": {
                "@type": "ImageObject",
                "url": data.imageUrl
            }
        })
    };
}

/**
 * Generate FAQ Schema for dream interpretation FAQ sections
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]): object {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
}

/**
 * Generate ItemList Schema for dream listing pages
 */
export function generateDreamListSchema(
    dreams: { title: string; url: string; description: string }[],
    pageUrl: string
): object {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "url": pageUrl,
        "numberOfItems": dreams.length,
        "itemListElement": dreams.map((dream, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": dream.url,
            "name": dream.title,
            "description": dream.description
        }))
    };
}

/**
 * Generate Organization + WebSite schemas for the homepage
 */
export function generateHomepageSchemas(): object[] {
    return [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": SITE_NAME,
            "alternateName": "Almofasir",
            "url": SITE_URL,
            "logo": LOGO_URL,
            "description": "منصة المفسر لتفسير الأحلام بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
            "sameAs": [
                "https://twitter.com/almofasir",
                "https://facebook.com/almofasir"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": `${SITE_NAME} - تفسير الأحلام`,
            "url": SITE_URL,
            "inLanguage": "ar",
            "description": "موقع تفسير الأحلام مجاناً بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي",
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${SITE_URL}/symbols?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": SITE_NAME,
                "logo": {
                    "@type": "ImageObject",
                    "url": LOGO_URL
                }
            }
        }
    ];
}
