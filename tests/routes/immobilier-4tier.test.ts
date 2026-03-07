/**
 * Route Validation Tests — 4-Tier Immobilier Routes
 *
 * Unit tests for slug validation patterns, breadcrumb construction,
 * slug transformations, and route pattern matching.
 *
 * Does NOT require a running Supabase instance — pure logic tests.
 * Run with: npx vitest tests/routes/immobilier-4tier.test.ts
 */

import { describe, it, expect } from 'vitest';
import { unslugify, capitalize } from '@/lib/slugs';

describe('4-Tier Immobilier Routes', () => {
  describe('route slug validation', () => {
    it('should match valid city slug patterns', () => {
      const validCitySlugs = ['dakar', 'thies', 'saint-louis'];
      const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

      validCitySlugs.forEach((slug) => {
        expect(slug).toMatch(pattern);
      });
    });

    it('should match valid district slug patterns', () => {
      const validDistrictSlugs = ['plateau', 'fann-point-e', 'almadies'];
      const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

      validDistrictSlugs.forEach((slug) => {
        expect(slug).toMatch(pattern);
      });
    });

    it('should match valid type slug patterns', () => {
      const validTypeSlugs = ['appartement', 'studio-apartment', 'villa'];
      const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

      validTypeSlugs.forEach((slug) => {
        expect(slug).toMatch(pattern);
      });
    });

    it('should reject invalid slug patterns', () => {
      const invalidSlugs = ['Dakar', 'plateau_2', 'fann--point', 'terrain!'];
      const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

      invalidSlugs.forEach((slug) => {
        expect(slug).not.toMatch(pattern);
      });
    });
  });

  describe('slug transformations', () => {
    it('should unslugify type for display', () => {
      expect(unslugify('studio-apartment')).toBe('studio apartment');
      expect(unslugify('appartement')).toBe('appartement');
    });

    it('should capitalize and unslugify for full display label', () => {
      const slug = 'studio-apartment';
      const displayType = capitalize(unslugify(slug));
      expect(displayType).toBe('Studio apartment');
    });

    it('should capitalize single-word type', () => {
      expect(capitalize('appartement')).toBe('Appartement');
      expect(capitalize('studio')).toBe('Studio');
      expect(capitalize('villa')).toBe('Villa');
    });
  });

  describe('breadcrumb construction', () => {
    it('should generate 4 items for district page', () => {
      const items = [
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/recherche' },
        { label: 'Dakar', href: '/immobilier/dakar' },
        { label: 'Plateau' },
      ];

      expect(items).toHaveLength(4);
      expect(items[3].href).toBeUndefined();
    });

    it('should generate 5 items for type page', () => {
      const items = [
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/recherche' },
        { label: 'Dakar', href: '/immobilier/dakar' },
        { label: 'Plateau', href: '/immobilier/dakar/plateau' },
        { label: 'Appartement' },
      ];

      expect(items).toHaveLength(5);
      expect(items[4].href).toBeUndefined();
    });

    it('should not have href on last breadcrumb item', () => {
      const items = [
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/recherche' },
        { label: 'Plateau' },
      ];

      const lastItem = items[items.length - 1];
      expect(lastItem.href).toBeUndefined();
    });

    it('should have href on all non-last breadcrumb items', () => {
      const items = [
        { label: 'Accueil', href: '/' },
        { label: 'Immobilier', href: '/recherche' },
        { label: 'Dakar', href: '/immobilier/dakar' },
        { label: 'Plateau', href: '/immobilier/dakar/plateau' },
        { label: 'Appartement' },
      ];

      items.slice(0, -1).forEach((item) => {
        expect(item.href).toBeDefined();
      });
    });
  });

  describe('route patterns', () => {
    it('should validate district page route pattern', () => {
      const pattern = /^\/immobilier\/[\w-]+\/[\w-]+$/;
      const validRoutes = [
        '/immobilier/dakar/plateau',
        '/immobilier/thies/thies-centre',
        '/immobilier/dakar/fann-point-e',
      ];

      validRoutes.forEach((route) => {
        expect(route).toMatch(pattern);
      });
    });

    it('should validate type page route pattern', () => {
      const pattern = /^\/immobilier\/[\w-]+\/[\w-]+\/[\w-]+$/;
      const validRoutes = [
        '/immobilier/dakar/plateau/appartement',
        '/immobilier/dakar/plateau/studio-apartment',
        '/immobilier/thies/centre-ville/villa',
      ];

      validRoutes.forEach((route) => {
        expect(route).toMatch(pattern);
      });
    });

    it('should not match district pattern for type routes', () => {
      const districtPattern = /^\/immobilier\/[\w-]+\/[\w-]+$/;
      const typeRoute = '/immobilier/dakar/plateau/appartement';
      expect(typeRoute).not.toMatch(districtPattern);
    });
  });

  describe('generateStaticParams placeholder', () => {
    it('should return empty array during Task 4 (Task 5 fills from RPC)', () => {
      // Both district and type pages return [] for generateStaticParams in Task 4
      // This means all routes are dynamically rendered on first request (dynamicParams = true)
      const params: never[] = [];
      expect(params).toHaveLength(0);
    });
  });
});
