/**
 * Static Params Generation Tests
 *
 * Tests pure transformation logic:
 *   - formatRpcRowsToTypeParams
 *   - formatRpcRowsToDistrictParams
 *
 * Does NOT call Supabase — uses fixture data only.
 * Matches the console.assert + try/catch pattern used in tests/districts.test.ts.
 *
 * Run with: npx tsx tests/seo/generateStaticParams.test.ts
 */

import {
  formatRpcRowsToTypeParams,
  formatRpcRowsToDistrictParams,
} from '@/lib/seo/generateStaticParams';

// ---------------------------------------------------------------------------
// Fixture data — represents a realistic RPC response
// ---------------------------------------------------------------------------
const mockRpcRows = [
  // Normal rows
  { city_slug: 'dakar', district_slug: 'plateau', property_type: 'appartement', property_count: 5 },
  { city_slug: 'dakar', district_slug: 'plateau', property_type: 'villa', property_count: 3 },
  { city_slug: 'dakar', district_slug: 'fann-point-e', property_type: 'appartement', property_count: 2 },
  { city_slug: 'thies', district_slug: 'thies-centre', property_type: 'studio appartement', property_count: 1 },
  // Edge cases that must be filtered
  { city_slug: 'dakar', district_slug: 'all', property_type: 'appartement', property_count: 10 }, // 'all' → no URL segment
  { city_slug: '', district_slug: 'plateau', property_type: 'appartement', property_count: 1 }, // missing city
  { city_slug: 'dakar', district_slug: 'plateau', property_type: '', property_count: 1 }, // missing type
];

// ---------------------------------------------------------------------------
// Helper: throw on failure (mirrors tests/districts.test.ts pattern)
// ---------------------------------------------------------------------------
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

// ---------------------------------------------------------------------------
// Suite 1: formatRpcRowsToTypeParams
// ---------------------------------------------------------------------------
console.log('\n=== formatRpcRowsToTypeParams ===\n');

try {
  const typeParams = formatRpcRowsToTypeParams(mockRpcRows);

  // Counts: 7 rows minus 'all' (1), missing city (1), missing type (1) = 4
  assert(
    typeParams.length === 4,
    `Should return 4 type params (got ${typeParams.length})`
  );

  // Slug with embedded space must be kebab-cased
  const studioParam = typeParams.find((p) => p.type === 'studio-appartement');
  assert(
    studioParam !== undefined,
    'Should slugify "studio appartement" → "studio-appartement"'
  );

  // First valid row — structure check
  assert(
    typeParams[0].city === 'dakar' &&
      typeParams[0].district === 'plateau' &&
      typeParams[0].type === 'appartement',
    'First param should be { city: "dakar", district: "plateau", type: "appartement" }'
  );

  // All params must have non-empty strings for all three fields
  const allFieldsPresent = typeParams.every(
    (p) => p.city && p.district && p.type
  );
  assert(allFieldsPresent, 'All type params should have city, district, and type fields');

  // No param should have district === 'all'
  const noAll = typeParams.every((p) => p.district !== 'all');
  assert(noAll, 'No type param should have district === "all"');

  console.log('\n✓ formatRpcRowsToTypeParams: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 2: formatRpcRowsToDistrictParams
// ---------------------------------------------------------------------------
console.log('\n=== formatRpcRowsToDistrictParams ===\n');

try {
  const districtParams = formatRpcRowsToDistrictParams(mockRpcRows);

  // After filtering 'all', missing city, missing type:
  //   dakar/plateau  (appears 2× for villa + appartement) → deduplicated to 1
  //   dakar/fann-point-e                                  → 1
  //   thies/thies-centre                                  → 1
  // Expected: 3 unique entries
  assert(
    districtParams.length === 3,
    `Should return 3 deduplicated district params (got ${districtParams.length})`
  );

  // dakar/plateau must appear exactly once despite 2 property_type rows
  const dakarPlateauCount = districtParams.filter(
    (p) => p.city === 'dakar' && p.district === 'plateau'
  ).length;
  assert(
    dakarPlateauCount === 1,
    `dakar/plateau should appear exactly once (got ${dakarPlateauCount})`
  );

  // Structure check on first entry
  assert(
    districtParams[0].city === 'dakar' && districtParams[0].district === 'plateau',
    'First district param should be { city: "dakar", district: "plateau" }'
  );

  // All params must have exactly two keys with non-empty values
  const allFieldsPresent = districtParams.every((p) => p.city && p.district);
  assert(allFieldsPresent, 'All district params should have city and district fields');

  // No param should have district === 'all'
  const noAll = districtParams.every((p) => p.district !== 'all');
  assert(noAll, 'No district param should have district === "all"');

  console.log('\n✓ formatRpcRowsToDistrictParams: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 3: Empty input edge case
// ---------------------------------------------------------------------------
console.log('\n=== Empty input edge cases ===\n');

try {
  const emptyType = formatRpcRowsToTypeParams([]);
  assert(emptyType.length === 0, 'Empty input should return [] for type params');

  const emptyDistrict = formatRpcRowsToDistrictParams([]);
  assert(emptyDistrict.length === 0, 'Empty input should return [] for district params');

  // All-invalid rows should return empty
  const invalidRows = [
    { city_slug: 'dakar', district_slug: 'all', property_type: 'villa', property_count: 5 },
    { city_slug: '', district_slug: 'plateau', property_type: 'villa', property_count: 5 },
  ];
  const typeFromInvalid = formatRpcRowsToTypeParams(invalidRows);
  assert(typeFromInvalid.length === 0, 'All-filtered rows should return [] for type params');

  console.log('\n✓ Empty input edge cases: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

console.log('\n✅ All generateStaticParams tests passed\n');
