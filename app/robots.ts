import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dousell-immo.app'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/compte/',
                    '/auth/',
                    '/gestion-locative/',
                    '/etats-lieux/',
                    '/portal/',
                    '/_next/',
                    '/private/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/admin/', '/compte/'],
            },
            {
                userAgent: ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot'],
                allow: '/',
                disallow: ['/api/', '/admin/', '/compte/', '/private/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
