/**
 * Districts Service — Direct Supabase Queries
 *
 * This module provides server-side functions to query districts and their associated properties.
 * Functions are designed to be wrapped with unstable_cache() in districtService.cached.ts for ISR optimization.
 *
 * Core responsibility:
 * - Query districts table by city or slug
 * - Query properties filtered by district (location.landmark)
 * - Return properly typed results without caching logic
 *
 * Rationale for separation:
 * - Pure queries are testable and reusable
 * - Caching logic is isolated in districtService.cached.ts
 * - Enables easy switching between cache strategies
 */

import { createClient } from '@/utils/supabase/server';
import type { District } from '@/types/districts';
import { safeLikeEscape } from '@/lib/slugs';

/**
 * Fetch all districts for a given city
 *
 * @param citySlug - City identifier (e.g., 'dakar', 'thies')
 * @returns Array of District objects, empty if city not found
 *
 * @example
 * const dakarDistricts = await getDistrictsByCity('dakar');
 * // Returns all 10 Dakar districts with coordinates, descriptions, etc.
 */
export async function getDistrictsByCity(citySlug: string): Promise<District[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('districts')
      .select('id, slug, name_fr, name_en, city_slug, lat, lng, description, landmarks, price_range_min, price_range_max, created_at, updated_at')
      .eq('city_slug', citySlug)
      .order('name_fr', { ascending: true });

    if (error) {
      console.error('[getDistrictsByCity] Query error:', { citySlug, error });
      throw error;
    }

    if (!data) {
      return [];
    }

    // Map database rows to District type
    return data.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name_fr: row.name_fr,
      name_en: row.name_en,
      city_slug: row.city_slug,
      coordinates: {
        lat: Number(row.lat), // Cast numeric to number
        lng: Number(row.lng),
      },
      description: row.description,
      landmarks: row.landmarks || [],
      price_range: row.price_range_min && row.price_range_max
        ? {
          min: row.price_range_min,
          max: row.price_range_max,
        }
        : undefined,
    }));
  } catch (error) {
    console.error('[getDistrictsByCity] Unexpected error:', { citySlug, error });
    throw error;
  }
}

/**
 * Fetch a single district by slug and city
 *
 * @param districtSlug - District slug (e.g., 'plateau')
 * @param citySlug - City slug (e.g., 'dakar')
 * @returns District object or null if not found
 *
 * @example
 * const plateau = await getDistrictBySlug('plateau', 'dakar');
 * if (plateau) {
 *   console.log(plateau.name_fr); // 'Plateau'
 * }
 */
export async function getDistrictBySlug(
  districtSlug: string,
  citySlug: string
): Promise<District | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('districts')
      .select('id, slug, name_fr, name_en, city_slug, lat, lng, description, landmarks, price_range_min, price_range_max, created_at, updated_at')
      .eq('slug', districtSlug)
      .eq('city_slug', citySlug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found — this is expected for invalid slugs
        return null;
      }
      console.error('[getDistrictBySlug] Query error (caught and returning null):', { districtSlug, citySlug, error });
      return null;
    }

    if (!data) {
      return null;
    }

    // Map database row to District type
    return {
      id: data.id,
      slug: data.slug,
      name_fr: data.name_fr,
      name_en: data.name_en,
      city_slug: data.city_slug,
      coordinates: {
        lat: Number(data.lat),
        lng: Number(data.lng),
      },
      description: data.description,
      landmarks: data.landmarks || [],
      price_range: data.price_range_min && data.price_range_max
        ? {
          min: data.price_range_min,
          max: data.price_range_max,
        }
        : undefined,
    };
  } catch (error) {
    console.error('[getDistrictBySlug] Unexpected error (caught and handled gracefully):', { districtSlug, citySlug, error });
    return null;
  }
}

/**
 * Fetch properties for a given district with optional filtering
 *
 * Properties are matched to a district by the `location.landmark` field.
 * This function queries the properties table and filters by:
 * - location.landmark contains the district slug (case-insensitive)
 * - category ('vente' or 'location') if provided
 * - details.type (e.g., 'appartement', 'maison') if provided
 *
 * @param districtSlug - District slug (e.g., 'plateau')
 * @param citySlug - City slug (e.g., 'dakar')
 * @param category - Optional filter: 'vente' or 'location'
 * @param type - Optional filter: property type (e.g., 'appartement')
 * @param limit - Max results (default: 20)
 * @param offset - Skip results (default: 0)
 * @returns Object with properties array and total count
 *
 * @example
 * const { properties, total } = await getPropertiesByDistrict('plateau', 'dakar', 'vente');
 * console.log(`Found ${total} vente properties in Plateau`);
 */
export async function getPropertiesByDistrict(
  districtSlug: string,
  citySlug: string,
  category?: 'vente' | 'location',
  type?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ properties: any[]; total: number }> {
  try {
    const supabase = await createClient();

    // Build filter conditions
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' });

    // Filter by district using landmark field in location JSONB
    // Note: location.landmark is a string that should contain the district name/slug
    query = query.ilike('location->landmark', `%${districtSlug}%`);

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by type if provided
    // Note: type is stored in details.type (JSONB nested field)
    // Use ilike for case-insensitive matching — slug 'appartement' must match 'Appartement' in DB
    // Escape LIKE metacharacters to prevent filter bypass via crafted slugs
    if (type) {
      query = query.ilike('details->>type', safeLikeEscape(type));
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[getPropertiesByDistrict] Query error (handling gracefully):', {
        districtSlug,
        citySlug,
        category,
        type,
        errorMessage: error.message,
        errorCode: error.code,
      });
      return { properties: [], total: 0 };
    }

    return {
      properties: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('[getPropertiesByDistrict] Unexpected error (handling gracefully):', {
      districtSlug,
      citySlug,
      category,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    return { properties: [], total: 0 };
  }
}
