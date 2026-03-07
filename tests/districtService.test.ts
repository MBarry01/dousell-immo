/**
 * Integration tests for Districts Service
 *
 * Tests verify:
 * - getDistrictsByCity returns array of districts for a city
 * - getDistrictBySlug returns exact district or null for invalid slug
 * - getPropertiesByDistrict returns paginated properties with correct filtering
 * - No duplicate results in property queries
 * - Proper filtering by category (vente/location) and type
 *
 * Run with: npm run test:districts or NODE_ENV=test npx vitest tests/districtService.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  getDistrictsByCity,
  getDistrictBySlug,
  getPropertiesByDistrict,
} from '@/services/districtService';
import type { District } from '@/types/districts';

describe('districtService', () => {
  const adminClient = createAdminClient();
  let testDistrictId: string;

  beforeAll(async () => {
    // Verify we can query districts table
    const { data, error } = await adminClient
      .from('districts')
      .select('id')
      .eq('city_slug', 'dakar')
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Districts table not seeded. Run migrations first.');
    }

    testDistrictId = data.id;
  });

  describe('getDistrictsByCity', () => {
    it('should return array of districts for a valid city', async () => {
      const districts = await getDistrictsByCity('dakar');

      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);
    });

    it('should return all districts with required fields', async () => {
      const districts = await getDistrictsByCity('dakar');

      districts.forEach((district: District) => {
        expect(district).toHaveProperty('id');
        expect(district).toHaveProperty('slug');
        expect(district).toHaveProperty('name_fr');
        expect(district).toHaveProperty('city_slug');
        expect(district.city_slug).toBe('dakar');
      });
    });

    it('should return empty array for invalid city', async () => {
      const districts = await getDistrictsByCity('invalid-city-xyz');

      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBe(0);
    });

    it('should return 10 districts for Dakar', async () => {
      const districts = await getDistrictsByCity('dakar');

      expect(districts.length).toBe(10);
    });

    it('should return districts with coordinates', async () => {
      const districts = await getDistrictsByCity('dakar');

      districts.forEach((district: District) => {
        expect(district.coordinates).toBeDefined();
        expect(district.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(district.coordinates.lat).toBeLessThanOrEqual(90);
        expect(district.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(district.coordinates.lng).toBeLessThanOrEqual(180);
      });
    });

    it('should have unique slugs within city', async () => {
      const districts = await getDistrictsByCity('dakar');
      const slugs = districts.map((d: District) => d.slug);
      const uniqueSlugs = new Set(slugs);

      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('getDistrictBySlug', () => {
    it('should return exact district for valid slug', async () => {
      const district = await getDistrictBySlug('plateau', 'dakar');

      expect(district).not.toBeNull();
      expect(district?.slug).toBe('plateau');
      expect(district?.name_fr).toBe('Plateau');
      expect(district?.city_slug).toBe('dakar');
    });

    it('should return null for invalid slug', async () => {
      const district = await getDistrictBySlug('invalid-slug-xyz', 'dakar');

      expect(district).toBeNull();
    });

    it('should return null for valid slug but wrong city', async () => {
      const district = await getDistrictBySlug('plateau', 'invalid-city');

      expect(district).toBeNull();
    });

    it('should return complete district data with coordinates', async () => {
      const district = await getDistrictBySlug('almadies', 'dakar');

      expect(district).not.toBeNull();
      expect(district?.coordinates).toBeDefined();
      expect(typeof district?.coordinates.lat).toBe('number');
      expect(typeof district?.coordinates.lng).toBe('number');
    });

    it('should return district with optional fields when present', async () => {
      const district = await getDistrictBySlug('plateau', 'dakar');

      // Plateau has description, landmarks, and price_range
      expect(district?.description).toBeDefined();
      expect(district?.landmarks).toBeDefined();
      expect(district?.price_range).toBeDefined();
    });

    it('should distinguish between Dakar and Thiès districts', async () => {
      const dakarDistrict = await getDistrictBySlug('plateau', 'dakar');
      const thiesDistrict = await getDistrictBySlug('centre-ville', 'thies');

      expect(dakarDistrict).not.toBeNull();
      expect(thiesDistrict).not.toBeNull();
      expect(dakarDistrict?.city_slug).toBe('dakar');
      expect(thiesDistrict?.city_slug).toBe('thies');
    });
  });

  describe('getPropertiesByDistrict', () => {
    it('should return paginated properties for a district', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 10, 0);

      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.properties)).toBe(true);
    });

    it('should return correct pagination info', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 5, 0);

      expect(result.properties.length).toBeLessThanOrEqual(5);
      expect(typeof result.total).toBe('number');
    });

    it('should filter by category (vente)', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', 'vente');

      result.properties.forEach((property: any) => {
        expect(property.category).toBe('vente');
      });
    });

    it('should filter by category (location)', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', 'location');

      result.properties.forEach((property: any) => {
        expect(property.category).toBe('location');
      });
    });

    it('should filter by type when provided', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', 'vente', 'appartement');

      result.properties.forEach((property: any) => {
        expect(property.details?.type).toBe('appartement');
      });
    });

    it('should return no duplicates', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 50, 0);

      const ids = result.properties.map((p: any) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should respect limit parameter', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 3, 0);

      expect(result.properties.length).toBeLessThanOrEqual(3);
    });

    it('should respect offset parameter', async () => {
      const result0 = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 5, 0);
      const result5 = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 5, 5);

      // With offset, we should get different properties
      if (result0.total > 5) {
        const ids0 = result0.properties.map((p: any) => p.id);
        const ids5 = result5.properties.map((p: any) => p.id);
        const overlap = ids0.filter((id) => ids5.includes(id));

        expect(overlap.length).toBe(0);
      }
    });

    it('should return empty array for invalid district', async () => {
      const result = await getPropertiesByDistrict('invalid-district-xyz', 'dakar');

      expect(result.properties.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle properties with landmark matching district', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar');

      // All returned properties should have 'plateau' in their location.landmark
      result.properties.forEach((property: any) => {
        const landmark = property.location?.landmark || '';
        expect(landmark.toLowerCase()).toContain('plateau');
      });
    });

    it('should have required fields in returned properties', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 1, 0);

      if (result.properties.length > 0) {
        const property = result.properties[0];
        expect(property).toHaveProperty('id');
        expect(property).toHaveProperty('title');
        expect(property).toHaveProperty('price');
        expect(property).toHaveProperty('category');
      }
    });

    it('should return default limit when not specified', async () => {
      const result = await getPropertiesByDistrict('plateau', 'dakar');

      expect(result.properties.length).toBeLessThanOrEqual(20);
    });
  });
});
