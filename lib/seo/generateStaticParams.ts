/**
 * Static Params Generation — Pre-render 4-tier SEO routes at build time
 *
 * Calls get_active_cities_districts_types RPC to fetch viable combinations,
 * then formats them into param objects for Next.js pre-rendering.
 *
 * Exported formatters are pure functions (no I/O) for testability.
 * Async wrappers handle RPC calls with graceful error fallback to [].
 */

import { createClient } from '@/utils/supabase/server';
import { slugify } from '@/lib/slugs';

export const STATIC_PARAMS_MIN_COUNT = 1;
export const STATIC_PARAMS_CATEGORY = 'vente';

// RPC response row shape — internal type, not exported (callers use the formatter return types)
interface RpcRow {
  city_slug: string;
  district_slug: string;
  property_type: string;
  property_count: number;
}

/**
 * Format RPC rows into type page params: [{ city, district, type }, ...]
 * - Filters out 'all' district rows (no valid URL segment)
 * - Filters out rows with missing city_slug or property_type
 * - Slugifies all fields for URL safety (handles accented landmarks and spaces)
 */
export function formatRpcRowsToTypeParams(
  rows: RpcRow[]
): { city: string; district: string; type: string }[] {
  return rows
    .filter((row) => row.district_slug !== 'all')
    .filter((row) => row.city_slug && row.property_type)
    .map((row) => ({
      city: slugify(row.city_slug),
      district: slugify(row.district_slug),
      type: slugify(row.property_type),
    }));
}

/**
 * Format RPC rows into district page params: [{ city, district }, ...]
 * - Filters out 'all' district rows (no valid URL segment)
 * - Filters out rows with missing city_slug or district_slug
 * - Deduplicates multiple type-rows per city+district to a single entry
 * - Slugifies all fields for URL safety
 */
export function formatRpcRowsToDistrictParams(
  rows: RpcRow[]
): { city: string; district: string }[] {
  const seen = new Set<string>();

  return rows
    .filter((row) => row.district_slug !== 'all')
    .filter((row) => row.city_slug && row.district_slug)
    .reduce(
      (acc, row) => {
        const city = slugify(row.city_slug);
        const district = slugify(row.district_slug);
        const key = `${city}|${district}`;
        if (!seen.has(key)) {
          seen.add(key);
          acc.push({ city, district });
        }
        return acc;
      },
      [] as { city: string; district: string }[]
    );
}

/**
 * Query RPC and return type page params.
 * Called at build time by generateStaticParams() in [city]/[district]/[type]/page.tsx.
 * Never throws — returns [] on any error to keep the build safe.
 */
export async function generateCityDistrictTypeParams(): Promise<
  { city: string; district: string; type: string }[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      'get_active_cities_districts_types',
      {
        min_count: STATIC_PARAMS_MIN_COUNT,
        target_category: STATIC_PARAMS_CATEGORY,
      }
    );

    if (error) {
      console.error('[generateCityDistrictTypeParams] RPC error:', error);
      return [];
    }

    return formatRpcRowsToTypeParams((data as RpcRow[]) || []);
  } catch (err) {
    console.error('[generateCityDistrictTypeParams] Exception:', err);
    return [];
  }
}

/**
 * Query RPC and return district page params.
 * Called at build time by generateStaticParams() in [city]/[district]/page.tsx.
 * Never throws — returns [] on any error to keep the build safe.
 */
export async function generateCityDistrictParams(): Promise<
  { city: string; district: string }[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      'get_active_cities_districts_types',
      {
        min_count: STATIC_PARAMS_MIN_COUNT,
        target_category: STATIC_PARAMS_CATEGORY,
      }
    );

    if (error) {
      console.error('[generateCityDistrictParams] RPC error:', error);
      return [];
    }

    return formatRpcRowsToDistrictParams((data as RpcRow[]) || []);
  } catch (err) {
    console.error('[generateCityDistrictParams] Exception:', err);
    return [];
  }
}
