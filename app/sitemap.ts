import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dousell-immo.app'

    // Pages statiques principales
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/recherche`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/estimation`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/landing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        // Nouvelles pages landing
        {
            url: `${baseUrl}/landing/a-propos`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/landing/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/landing/carrieres`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/landing/investissement`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/landing/syndic`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/landing/signup`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        // Pages légales et informatives
        {
            url: `${baseUrl}/a-propos`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/cgu`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/legal/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    // Pages dynamiques (propriétés)
    let propertyPages: MetadataRoute.Sitemap = []

    try {
        const supabase = await createClient()
        const { data: properties } = await supabase
            .from('properties')
            .select('id, updated_at')
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(500) // Limiter pour performance

        if (properties) {
            propertyPages = properties.map((property) => ({
                url: `${baseUrl}/biens/${property.id}`,
                lastModified: new Date(property.updated_at),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }))
        }
    } catch (error) {
        console.error('Error fetching properties for sitemap:', error)
    }

    return [...staticPages, ...propertyPages]
}
