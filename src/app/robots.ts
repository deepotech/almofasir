import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/dashboard/', '/api/'], // Protect sensitive areas
        },
        sitemap: 'https://almofasir.com/sitemap.xml',
    };
}
