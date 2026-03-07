/**
 * Manual integration test for Districts Service
 * Run with: NODE_ENV=test npx tsx tests/districtService.manual.ts
 *
 * This bypasses vitest setup and directly tests the service functions
 */

// Load environment variables before imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '@/utils/supabase/admin';
import {
  getDistrictsByCity,
  getDistrictBySlug,
  getPropertiesByDistrict,
} from '@/services/districtService';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    passCount++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n=== Districts Service Integration Tests ===\n');

  try {
    // Test 1: getDistrictsByCity
    console.log('Testing getDistrictsByCity...');
    const dakarDistricts = await getDistrictsByCity('dakar');
    assert(Array.isArray(dakarDistricts), 'Returns array');
    assert(dakarDistricts.length > 0, 'Returns non-empty array for Dakar');
    assert(dakarDistricts.length === 10, 'Returns exactly 10 Dakar districts');

    // Validate structure
    const firstDistrict = dakarDistricts[0];
    assert(!!firstDistrict.id, 'District has id');
    assert(!!firstDistrict.slug, 'District has slug');
    assert(!!firstDistrict.name_fr, 'District has name_fr');
    assert(firstDistrict.city_slug === 'dakar', 'District has correct city_slug');
    assert(!!firstDistrict.coordinates, 'District has coordinates');
    assert(typeof firstDistrict.coordinates.lat === 'number', 'Latitude is number');
    assert(typeof firstDistrict.coordinates.lng === 'number', 'Longitude is number');

    // Test 2: Invalid city
    console.log('\nTesting getDistrictsByCity with invalid city...');
    const invalidCity = await getDistrictsByCity('invalid-city-xyz');
    assert(Array.isArray(invalidCity), 'Returns array for invalid city');
    assert(invalidCity.length === 0, 'Returns empty array for invalid city');

    // Test 3: getDistrictBySlug
    console.log('\nTesting getDistrictBySlug...');
    const plateau = await getDistrictBySlug('plateau', 'dakar');
    assert(plateau !== null, 'Returns district for valid slug');
    assert(plateau?.slug === 'plateau', 'Returns correct district slug');
    assert(plateau?.name_fr === 'Plateau', 'Returns correct French name');
    assert(plateau?.city_slug === 'dakar', 'Returns correct city slug');
    assert(!!plateau?.coordinates, 'Has coordinates');
    assert(!!plateau?.description, 'Has description');
    assert(!!plateau?.landmarks, 'Has landmarks array');
    assert(!!plateau?.price_range, 'Has price_range');

    // Test 4: Invalid district slug
    console.log('\nTesting getDistrictBySlug with invalid slug...');
    const invalidSlug = await getDistrictBySlug('invalid-slug-xyz', 'dakar');
    assert(invalidSlug === null, 'Returns null for invalid slug');

    // Test 5: Wrong city for valid slug
    console.log('\nTesting getDistrictBySlug with wrong city...');
    const wrongCity = await getDistrictBySlug('plateau', 'invalid-city');
    assert(wrongCity === null, 'Returns null for valid slug but wrong city');

    // Test 6: Thiès district
    console.log('\nTesting Thiès districts...');
    const thiesDistricts = await getDistrictsByCity('thies');
    assert(thiesDistricts.length > 0, 'Thiès has districts');
    const centreVille = await getDistrictBySlug('centre-ville', 'thies');
    assert(centreVille !== null, 'Thiès centre-ville exists');
    assert(centreVille?.name_fr === 'Centre-Ville', 'Thiès centre-ville has correct name');

    // Test 7: getPropertiesByDistrict
    console.log('\nTesting getPropertiesByDistrict...');
    const result = await getPropertiesByDistrict('plateau', 'dakar');
    assert(result !== null, 'Returns result object');
    assert(result.hasOwnProperty('properties'), 'Result has properties array');
    assert(result.hasOwnProperty('total'), 'Result has total count');
    assert(Array.isArray(result.properties), 'Properties is array');

    // Test 8: Pagination
    console.log('\nTesting pagination...');
    const page1 = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 5, 0);
    const page2 = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 5, 5);
    assert(page1.properties.length <= 5, 'Limit respected on page 1');
    assert(page2.properties.length <= 5, 'Limit respected on page 2');

    // If we have enough properties, verify no overlap between pages
    if (page1.total > 5) {
      const page1Ids = page1.properties.map((p: any) => p.id);
      const page2Ids = page2.properties.map((p: any) => p.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      assert(overlap.length === 0, 'No overlap between pagination pages');
    }

    // Test 9: Category filtering
    console.log('\nTesting category filtering...');
    const venteResult = await getPropertiesByDistrict('plateau', 'dakar', 'vente', undefined, 50);
    if (venteResult.properties.length > 0) {
      const allVente = venteResult.properties.every((p: any) => p.category === 'vente');
      assert(allVente, 'All returned properties are vente category');
    }

    const locationResult = await getPropertiesByDistrict('plateau', 'dakar', 'location', undefined, 50);
    if (locationResult.properties.length > 0) {
      const allLocation = locationResult.properties.every((p: any) => p.category === 'location');
      assert(allLocation, 'All returned properties are location category');
    }

    // Test 10: No duplicates in results
    console.log('\nTesting for duplicate results...');
    const largePage = await getPropertiesByDistrict('plateau', 'dakar', undefined, undefined, 100, 0);
    if (largePage.properties.length > 0) {
      const ids = largePage.properties.map((p: any) => p.id);
      const uniqueIds = new Set(ids);
      assert(uniqueIds.size === ids.length, 'No duplicate properties in results');
    }

    // Test 11: Default limit
    console.log('\nTesting default limit...');
    const defaultLimit = await getPropertiesByDistrict('plateau', 'dakar');
    assert(defaultLimit.properties.length <= 20, 'Default limit of 20 is respected');

    // Test 12: Invalid district
    console.log('\nTesting invalid district...');
    const invalidDistrict = await getPropertiesByDistrict('invalid-district-xyz', 'dakar');
    assert(invalidDistrict.properties.length === 0, 'Returns empty results for invalid district');
    assert(invalidDistrict.total === 0, 'Total is 0 for invalid district');

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);

    if (failCount === 0) {
      console.log(`\n${colors.green}All tests passed!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}Some tests failed.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n' + colors.red + 'Error during tests:' + colors.reset, error);
    process.exit(1);
  }
}

runTests();
