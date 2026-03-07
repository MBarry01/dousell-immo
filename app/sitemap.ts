import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { slugify } from '@/lib/slugs';
import { getArticles } from '@/lib/actions/blog';

const BASE_URL = 'https://www.dousel.com';

export const revalidate = 86400; // Update sitemap every 24h (réduit la charge Vercel)

interface RpcRow {
  city_slug: string;
  district_slug: string;
  property_type: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    // 0. Récupérer les articles publiés
    const publishedArticles = await getArticles('published');

    // 1. Récupérer les données 4-tier (city/district/type) pour VENTE
    const supabase = await createClient();
    const { data: vente4tier } = await supabase
        .rpc('get_active_cities_districts_types', { min_count: 1, target_category: 'vente' });

    // 2. Récupérer tous les biens approuvés pour les inclure individuellement
    const { data: properties } = await supabase
        .from('properties')
        .select('id, updated_at')
        .eq('validation_status', 'approved')
        .eq('status', 'disponible');

    const routes: MetadataRoute.Sitemap = [];

    // Helper pour ajouter les routes 4-tier (city/district/type)
    const add4TierRoutes = (items: RpcRow[] | null) => {
        const processedCities = new Set<string>();
        const processedDistricts = new Set<string>();

        // Root immobilier
        routes.push({
            url: `${BASE_URL}/immobilier`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        });

        // Traiter chaque combinaison city/district/type
        (items || [])
            .filter((row) => row.district_slug !== 'all') // Filtrer les 'all' districts
            .forEach((row) => {
                const citySlug = slugify(row.city_slug);
                const districtSlug = slugify(row.district_slug);
                const typeSlug = slugify(row.property_type);

                // Tier 4: /immobilier/[city]/[district]/[type]
                routes.push({
                    url: `${BASE_URL}/immobilier/${citySlug}/${districtSlug}/${typeSlug}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.8,
                });

                // Mémoriser les villes et quartiers uniques
                processedCities.add(citySlug);
                processedDistricts.add(`${citySlug}|${districtSlug}`);
            });

        // Tier 3: /immobilier/[city]/[district] (déduplicaté par clé unique)
        processedDistricts.forEach((key) => {
            const [citySlug, districtSlug] = key.split('|');
            routes.push({
                url: `${BASE_URL}/immobilier/${citySlug}/${districtSlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.85,
            });
        });

        // Tier 2: /immobilier/[city] (déduplicaté par set)
        processedCities.forEach((citySlug) => {
            routes.push({
                url: `${BASE_URL}/immobilier/${citySlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            });
        });
    }

    add4TierRoutes(vente4tier as RpcRow[] | null);

    // Mappage des biens individuels
    const propertyRoutes = (properties || []).map((prop) => ({
        url: `${BASE_URL}/biens/${prop.id}`,
        lastModified: new Date(prop.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // 5. Articles de blog publiés
    const blogRoutes: MetadataRoute.Sitemap = (publishedArticles || []).map((article) => ({
        url: `${BASE_URL}/blog/${article.slug}`,
        lastModified: new Date(article.published_at || article.created_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // 4. Les pages statiques de base
    const staticRoutes = [
        '',
        '/recherche',
        '/a-propos',
        '/contact',
        '/planifier-visite',
        '/blog',
        '/barometre-prix-immobilier-senegal',
        '/pro/blog/immobilier-senegal-diaspora',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 1.0,
    }));

    return [...staticRoutes, ...routes, ...propertyRoutes, ...blogRoutes];
}
