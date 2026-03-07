/**
 * Districts Service — Cached Version with ISR Optimization
 *
 * This module wraps districtService functions with unstable_cache() for ISR (Incremental Static Regeneration).
 * Implements Next.js 16 cache-aside pattern with configurable revalidation times.
 *
 * Caching strategy:
 * - Districts: 24h revalidate (slow-changing administrative data)
 * - Properties: 1h revalidate (more dynamic, user-dependent)
 * - Invalidation tags: 'districts' and 'properties' for selective revalidation
 *
 * Usage:
 * - Use these functions instead of the direct service in Server Components / Actions
 * - Call revalidateTag('districts') or revalidateTag('properties') to invalidate cache
 */

import { unstable_cache } from 'next/cache';
import {
  getDistrictsByCity as getDistrictsByCityDirect,
  getDistrictBySlug as getDistrictBySlugDirect,
  getPropertiesByDistrict as getPropertiesByDistrictDirect,
} from './districtService';
import type { District } from '@/types/districts';

/**
 * Cached version of getDistrictsByCity
 * Revalidates every 24 hours or on demand via revalidateTag('districts')
 */
export const getCachedDistrictsByCity = unstable_cache(
  async (citySlug: string): Promise<District[]> => {
    return getDistrictsByCityDirect(citySlug);
  },
  ['districts', 'city'], // Cache key prefix
  {
    revalidate: 86400, // 24 hours
    tags: ['districts'],
  }
);

/**
 * Cached version of getDistrictBySlug
 * Revalidates every 24 hours or on demand via revalidateTag('districts')
 */
export const getCachedDistrictBySlug = unstable_cache(
  async (districtSlug: string, citySlug: string): Promise<District | null> => {
    return getDistrictBySlugDirect(districtSlug, citySlug);
  },
  ['districts', 'slug'], // Cache key prefix
  {
    revalidate: 86400, // 24 hours
    tags: ['districts'],
  }
);

/**
 * Cached version of getPropertiesByDistrict
 * Revalidates every 1 hour or on demand via revalidateTag('properties')
 *
 * Note: This caches based on (districtSlug, citySlug, category, type, limit, offset) tuple.
 * Changing any parameter creates a new cache entry.
 */
export const getCachedPropertiesByDistrict = unstable_cache(
  async (
    districtSlug: string,
    citySlug: string,
    category?: 'vente' | 'location',
    type?: string,
    limit?: number,
    offset?: number
  ): Promise<{ properties: any[]; total: number }> => {
    return getPropertiesByDistrictDirect(
      districtSlug,
      citySlug,
      category,
      type,
      limit,
      offset
    );
  },
  ['properties', 'district'], // Cache key prefix
  {
    revalidate: 3600, // 1 hour
    tags: ['properties', 'districts'],
  }
);

/**
 * Export the base functions as well for contexts where caching is not needed
 * (e.g., in API routes that implement their own caching)
 */
export {
  getDistrictsByCity,
  getDistrictBySlug,
  getPropertiesByDistrict,
} from './districtService';

export type { District } from '@/types/districts';
