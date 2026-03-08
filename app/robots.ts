import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dousel.com';

/**
 * Robots Configuration for SEO
 *
 * Explicitly allows crawling of all 4-tier immobilier routes:
 * - /immobilier (root)
 * - /immobilier/[city] (tier 2)
 * - /immobilier/[city]/[district] (tier 3)
 * - /immobilier/[city]/[district]/[type] (tier 4)
 *
 * Blocks aggressive SEO bots and internal admin/auth routes.
 */

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Aggressive SEO/crawling bots that consume bandwidth without value
            {
                userAgent: 'AhrefsBot',
                disallow: '/',
            },
            {
                userAgent: 'SemrushBot',
                disallow: '/',
            },
            {
                userAgent: 'MJ12bot',
                disallow: '/',
            },
            {
                userAgent: 'DotBot',
                disallow: '/',
            },
            {
                userAgent: 'BLEXBot',
                disallow: '/',
            },
            // Google search bot - fastest crawl, no delay
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/gestion/', '/compte/', '/auth/', '/admin/', '/api/', '/workspace/'],
                crawlDelay: 0,
            },
            // All other bots - allow with 10 second crawl delay
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/immobilier',
                    '/immobilier/',
                    '/biens',
                    '/location',
                    '/vente',
                    '/recherche',
                ],
                disallow: [
                    '/gestion/',
                    '/compte/',
                    '/auth/',
                    '/admin/',
                    '/api/',
                    '/workspace/',
                ],
                crawlDelay: 10,
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
