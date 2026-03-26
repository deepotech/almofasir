import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/_next/',
                    '/api/',
                    '/dashboard/',
                    '/admin/',
                    '/login',
                    '/register',
                    '/auth/',
                    '/chat/',
                    '/journal/',
                    '/my-interpretations/',
                    '/interpret/',
                ],
            },
        ],
        sitemap: 'https://almofasir.com/sitemap.xml',
        host: 'https://almofasir.com',
    };
}
