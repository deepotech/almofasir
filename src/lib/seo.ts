/**
 * SEO Helpers - JSON-LD Schema Generation
 */

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
            "name": "المفسّر",
            "url": "https://almofasser.com"
        },
        "publisher": {
            "@type": "Organization",
            "name": "المفسّر - منصة تفسير الأحلام",
            "url": "https://almofasser.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://almofasser.com/logo.png"
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
