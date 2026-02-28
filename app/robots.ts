import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dousel.com';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Bots agressifs (SEO payants) : aucune valeur métier, consomment du bandwidth
            { userAgent: 'AhrefsBot', disallow: '/' },
            { userAgent: 'SemrushBot', disallow: '/' },
            { userAgent: 'MJ12bot', disallow: '/' },
            { userAgent: 'DotBot', disallow: '/' },
            { userAgent: 'BLEXBot', disallow: '/' },
            // Tous les autres bots (Google, Bing, etc.) : crawl autorisé avec délai
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/gestion/',
                    '/compte/',
                    '/auth/',
                    '/admin/',
                    '/api/',
                ],
                crawlDelay: 10,
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
