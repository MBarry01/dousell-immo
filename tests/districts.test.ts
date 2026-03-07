/**
 * Unit tests for Districts data structure (SEO quartier/district pages)
 *
 * This test suite verifies that district data is correctly structured,
 * has unique slugs, and validates both hardcoded and database scenarios.
 *
 * Run with: npx tsx tests/districts.test.ts
 */

import { District, SENEGAL_DISTRICTS } from '../types/districts';

// Simple assertion helpers (no framework dependency)
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${message}\n  Expected: ${expected}\n  Got: ${actual}`);
  }
  console.log(`[PASS] ${message}`);
}

function assertTrue(value: boolean, message: string) {
  if (!value) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

function assertArrayContains<T>(array: T[], value: T, message: string) {
  if (!array.includes(value)) {
    throw new Error(`[FAIL] ${message}\n  Array does not contain: ${value}`);
  }
  console.log(`[PASS] ${message}`);
}

// Tests
console.log('\n=== District Type Validation ===\n');

try {
  // Test 1: District type with required fields
  const sampleDistrict: District = {
    id: 'plateau-001',
    slug: 'plateau',
    name_fr: 'Plateau',
    city_slug: 'dakar',
    coordinates: {
      lat: 14.6756,
      lng: -17.4412,
    },
  };

  assertTrue(sampleDistrict.slug !== undefined, 'should have slug field');
  assertTrue(sampleDistrict.name_fr !== undefined, 'should have name_fr field');
  assertTrue(
    sampleDistrict.city_slug !== undefined,
    'should have city_slug field'
  );
  assertTrue(
    sampleDistrict.coordinates.lat !== undefined,
    'should have coordinates.lat field'
  );
  assertTrue(
    sampleDistrict.coordinates.lng !== undefined,
    'should have coordinates.lng field'
  );

  // Test 2: Optional fields
  const fullDistrict: District = {
    id: 'almadies-001',
    slug: 'almadies',
    name_fr: 'Almadies',
    name_en: 'Almadies',
    city_slug: 'dakar',
    coordinates: {
      lat: 14.7358,
      lng: -17.5038,
    },
    description: 'Quartier côtier prestigieux',
    landmarks: ['Phare des Almadies', 'Plage de Ngor'],
    price_range: {
      min: 50000000,
      max: 300000000,
    },
  };

  assertEqual(fullDistrict.name_en, 'Almadies', 'should allow name_en');
  assertTrue(
    fullDistrict.description !== undefined,
    'should allow description field'
  );
  assertTrue(
    fullDistrict.landmarks !== undefined &&
      fullDistrict.landmarks.length > 0,
    'should allow landmarks array'
  );
  assertTrue(
    fullDistrict.price_range?.min !== undefined,
    'should allow price_range.min'
  );

  console.log('\n=== SENEGAL_DISTRICTS Constant ===\n');

  // Test 3: Array exists and has data
  assertTrue(
    Array.isArray(SENEGAL_DISTRICTS),
    'SENEGAL_DISTRICTS should be an array'
  );
  assertTrue(
    SENEGAL_DISTRICTS.length > 0,
    'SENEGAL_DISTRICTS should not be empty'
  );

  // Test 4: Dakar districts count
  const dakarDistricts = SENEGAL_DISTRICTS.filter(
    (d) => d.city_slug === 'dakar'
  );
  assertTrue(
    dakarDistricts.length >= 10,
    'should have at least 10 Dakar districts'
  );

  // Test 5: Required Dakar districts
  const requiredSlugs = [
    'plateau',
    'almadies',
    'ouakam',
    'yoff',
    'ngor',
    'mermoz',
    'fann-point-e',
    'hann-bel-air',
    'liberte',
    'patte-doie',
  ];
  const existingSlugs = SENEGAL_DISTRICTS.map((d) => d.slug);

  requiredSlugs.forEach((slug) => {
    assertArrayContains(
      existingSlugs,
      slug,
      `should have ${slug} district`
    );
  });

  // Test 6: Thiès center
  const thiesCenters = SENEGAL_DISTRICTS.filter(
    (d) => d.city_slug === 'thies'
  );
  assertTrue(thiesCenters.length > 0, 'should have Thiès center district');

  // Test 7: Unique slugs
  const slugs = SENEGAL_DISTRICTS.map((d) => d.slug);
  const uniqueSlugs = new Set(slugs);
  assertEqual(
    uniqueSlugs.size,
    slugs.length,
    'all district slugs should be unique'
  );

  // Test 8: Valid coordinates
  SENEGAL_DISTRICTS.forEach((district) => {
    assertTrue(
      typeof district.coordinates.lat === 'number',
      `${district.slug}: coordinates.lat should be number`
    );
    assertTrue(
      typeof district.coordinates.lng === 'number',
      `${district.slug}: coordinates.lng should be number`
    );
    assertTrue(
      district.coordinates.lat >= -90 && district.coordinates.lat <= 90,
      `${district.slug}: latitude should be between -90 and 90`
    );
    assertTrue(
      district.coordinates.lng >= -180 && district.coordinates.lng <= 180,
      `${district.slug}: longitude should be between -180 and 180`
    );
  });

  // Test 9: Valid city_slug values
  const validCities = ['dakar', 'thies'];
  SENEGAL_DISTRICTS.forEach((district) => {
    assertTrue(
      validCities.includes(district.city_slug),
      `${district.slug}: city_slug should be dakar or thies`
    );
  });

  // Test 10: Slug format (lowercase, hyphens only)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  SENEGAL_DISTRICTS.forEach((district) => {
    assertTrue(
      slugRegex.test(district.slug),
      `${district.slug}: should match slug format (lowercase, hyphens)`
    );
  });

  // Test 11: Non-empty name_fr
  SENEGAL_DISTRICTS.forEach((district) => {
    assertTrue(
      district.name_fr !== undefined &&
        district.name_fr.length > 0,
      `${district.slug}: name_fr should not be empty`
    );
  });

  console.log('\n=== Data Quality ===\n');

  // Test 12: Unique IDs
  const ids = SENEGAL_DISTRICTS.map((d) => d.id);
  const uniqueIds = new Set(ids);
  assertEqual(uniqueIds.size, ids.length, 'all district IDs should be unique');

  // Test 13: No hardcoded price estimates in descriptions
  SENEGAL_DISTRICTS.forEach((district) => {
    if (district.description) {
      const pricePattern = /\d+\s*(M|million|fcfa|XOF)/i;
      assertTrue(
        !pricePattern.test(district.description),
        `${district.slug}: description should not contain hardcoded price estimates`
      );
    }
  });

  console.log('\n✓ All tests passed!\n');
} catch (error) {
  console.error('\n✗ Test failed:\n', error);
  process.exit(1);
}
