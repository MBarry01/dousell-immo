import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/slugs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dousel.com';

export const revalidate = 3600; // Update sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    // 1. Récupérer les données LOCATION
    const { data: rentals } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'location' });

    // 2. Récupérer les données VENTE
    const { data: sales } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'vente' });

    const routes: MetadataRoute.Sitemap = [];

    // Helper pour ajouter des routes
    const addRoutes = (items: any[], mode: 'location' | 'vente') => {
        const processedCities = new Set<string>();

        // Root de la section
        routes.push({
            url: `${BASE_URL}/${mode}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        });

        (items || []).forEach((page: { city: string; type: string }) => {
            const citySlug = slugify(page.city);
            const typeSlug = slugify(page.type);

            // Page Ville/Type (Feuille)
            routes.push({
                url: `${BASE_URL}/${mode}/${citySlug}/${typeSlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            });

            // Collecter les villes uniques
            processedCities.add(citySlug);
        });

        // Pages Ville (Parents)
        processedCities.forEach(citySlug => {
            routes.push({
                url: `${BASE_URL}/${mode}/${citySlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            });
        });
    }

    addRoutes(rentals, 'location');
    addRoutes(sales, 'vente');

    // 3. Les pages statiques de base
    const staticRoutes = [
        '',
        '/recherche',
        '/a-propos',
        '/contact',
        '/planifier-visite',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 1.0,
    }));

    return [...staticRoutes, ...routes];
}
