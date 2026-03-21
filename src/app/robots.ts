import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/_next/', '/admin/', '/dashboard/', '/api/'], // Protect system and sensitive areas
        },
        sitemap: 'https://almofasir.com/sitemap.xml',
    };
}
