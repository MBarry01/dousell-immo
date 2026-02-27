import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/slugs';

const BASE_URL = 'https://www.dousel.com';

export const revalidate = 3600; // Update sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    // 1. Récupérer les données LOCATION
    const { data: rentals } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'location' });

    // 2. Récupérer les données VENTE
    const { data: sales } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1, target_transaction_type: 'vente' });

    // 3. Récupérer les données IMMOBILIER (Global)
    const { data: global } = await supabase
        .rpc('get_active_cities_and_types', { min_count: 1 });

    // 4. Récupérer tous les biens approuvés pour les inclure individuellement
    const { data: properties } = await supabase
        .from('properties')
        .select('id, updated_at')
        .eq('validation_status', 'approved')
        .eq('status', 'disponible');

    const routes: MetadataRoute.Sitemap = [];

    // Helper pour ajouter des routes de catégories
    const addCategoryRoutes = (items: any[], mode: 'location' | 'vente' | 'immobilier') => {
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

    addCategoryRoutes(rentals, 'location');
    addCategoryRoutes(sales, 'vente');
    addCategoryRoutes(global, 'immobilier');

    // Mappage des biens individuels
    const propertyRoutes = (properties || []).map((prop) => ({
        url: `${BASE_URL}/biens/${prop.id}`,
        lastModified: new Date(prop.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // 4. Les pages statiques de base
    const staticRoutes = [
        '',
        '/recherche',
        '/a-propos',
        '/contact',
        '/planifier-visite',
        '/pro/blog/immobilier-senegal-diaspora',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 1.0,
    }));

    return [...staticRoutes, ...routes, ...propertyRoutes];
}
