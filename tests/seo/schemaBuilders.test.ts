/**
 * Schema Builders Tests
 *
 * Tests pure schema builder functions:
 *   - buildBreadcrumbSchema
 *   - buildAggregateOfferSchema
 *   - buildFaqSchema
 *
 * All functions are deterministic and testable (no I/O).
 * Run with: npx tsx tests/seo/schemaBuilders.test.ts
 */

import {
  buildBreadcrumbSchema,
  buildAggregateOfferSchema,
  buildFaqSchema,
  BreadcrumbItem,
  PropertyForSchema,
} from '@/lib/seo/schemaBuilders';
import { FaqItem } from '@/lib/seo/faqItems';

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
// Suite 1: buildBreadcrumbSchema
// ---------------------------------------------------------------------------
console.log('\n=== buildBreadcrumbSchema ===\n');

try {
  const items: BreadcrumbItem[] = [
    { name: 'Accueil', url: 'https://doussel-immo.sn' },
    { name: 'Immobilier', url: 'https://doussel-immo.sn/recherche' },
    { name: 'Dakar', url: 'https://doussel-immo.sn/immobilier/dakar' },
    { name: 'Plateau' }, // Current page, no URL
  ];

  const schema = buildBreadcrumbSchema(items);

  // Structure checks
  assert(schema['@context'] === 'https://schema.org', 'Should have correct @context');
  assert(schema['@type'] === 'BreadcrumbList', 'Should have BreadcrumbList type');
  assert(Array.isArray(schema.itemListElement), 'Should have itemListElement array');

  const elements = schema.itemListElement as Array<Record<string, unknown>>;
  assert(elements.length === 4, `Should have 4 items (got ${elements.length})`);

  // First item should have URL
  assert(
    elements[0]['@type'] === 'ListItem',
    'First item should be ListItem'
  );
  assert(
    elements[0].position === 1,
    'First item should have position 1'
  );
  assert(
    elements[0].item === 'https://doussel-immo.sn',
    'First item should have URL'
  );

  // Last item should NOT have URL
  assert(
    elements[3]['@type'] === 'ListItem',
    'Last item should be ListItem'
  );
  assert(
    elements[3].position === 4,
    'Last item should have position 4'
  );
  assert(
    elements[3].item === undefined,
    'Last item should NOT have URL'
  );
  assert(
    elements[3].name === 'Plateau',
    'Last item should have name "Plateau"'
  );

  console.log('\n✓ buildBreadcrumbSchema: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 2: buildAggregateOfferSchema
// ---------------------------------------------------------------------------
console.log('\n=== buildAggregateOfferSchema ===\n');

try {
  // Test with valid price data
  const properties: PropertyForSchema[] = [
    { prix: 50000000, type: 'appartement' }, // 50M XOF
    { prix: 75000000, type: 'villa' }, // 75M XOF
    { prix: 100000000, type: 'villa' }, // 100M XOF
  ];

  const schema = buildAggregateOfferSchema(properties, 'Dakar', 'Plateau');

  // Structure checks
  assert(schema['@context'] === 'https://schema.org', 'Should have correct @context');
  assert(schema['@type'] === 'AggregateOffer', 'Should have AggregateOffer type');
  assert(schema.priceCurrency === 'XOF', 'Should have XOF currency');
  assert(schema.offerCount === 3, `Should have 3 offers (got ${schema.offerCount})`);
  assert(
    schema.areaServed === 'Plateau, Dakar',
    'Should have correct areaServed'
  );

  // Price formatting should convert centimes to XOF (divide by 100)
  // Note: toLocaleString uses non-breaking spaces in fr-FR locale
  assert(
    (schema.lowPrice as string).replace(/\s/g, ' ') === '500 000',
    `Low price should be '500 000' (got ${schema.lowPrice})`
  );
  assert(
    (schema.highPrice as string).replace(/\s/g, ' ') === '1 000 000',
    `High price should be '1 000 000' (got ${schema.highPrice})`
  );

  // Test with empty array
  const emptySchema = buildAggregateOfferSchema([], 'Dakar', 'Plateau');
  assert(
    emptySchema['@type'] === 'AggregateOffer',
    'Empty array should still return valid schema'
  );
  assert(
    emptySchema.offerCount === 0,
    'Empty array should have 0 offers'
  );
  assert(
    emptySchema.lowPrice === undefined,
    'Empty array should not have lowPrice'
  );

  // Test with invalid/zero prices
  const invalidProperties: PropertyForSchema[] = [
    { prix: 0, type: 'villa' }, // Skip: 0
    { prix: -1, type: 'villa' }, // Skip: negative
    { prix: undefined, type: 'villa' }, // Skip: undefined
  ];
  const invalidSchema = buildAggregateOfferSchema(invalidProperties, 'Dakar', 'Plateau');
  assert(
    invalidSchema.offerCount === 3, // Count is still 3
    'Should count all items even if prices are invalid'
  );
  assert(
    invalidSchema.lowPrice === undefined,
    'Should not calculate prices if no valid prices'
  );

  console.log('\n✓ buildAggregateOfferSchema: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 3: buildFaqSchema
// ---------------------------------------------------------------------------
console.log('\n=== buildFaqSchema ===\n');

try {
  const faqItems: FaqItem[] = [
    {
      question: 'Quel est le prix moyen?',
      answer: 'Le prix moyen est 50M XOF.',
    },
    {
      question: 'Comment acheter?',
      answer: 'Contactez les agents immobiliers.',
    },
    {
      question: 'Meilleure période?',
      answer: 'Toute l\'année.',
    },
  ];

  const schema = buildFaqSchema(faqItems);

  // Structure checks
  assert(schema['@context'] === 'https://schema.org', 'Should have correct @context');
  assert(schema['@type'] === 'FAQPage', 'Should have FAQPage type');
  assert(Array.isArray(schema.mainEntity), 'Should have mainEntity array');

  const questions = schema.mainEntity as Array<Record<string, unknown>>;
  assert(questions.length === 3, `Should have 3 questions (got ${questions.length})`);

  // First question check
  assert(
    questions[0]['@type'] === 'Question',
    'First item should be Question'
  );
  assert(
    questions[0].name === 'Quel est le prix moyen?',
    'First question name should match'
  );

  const acceptedAnswer = questions[0].acceptedAnswer as Record<string, unknown>;
  assert(
    acceptedAnswer['@type'] === 'Answer',
    'acceptedAnswer should have Answer type'
  );
  assert(
    acceptedAnswer.text === 'Le prix moyen est 50M XOF.',
    'Answer text should match'
  );

  // Test with empty array
  const emptySchema = buildFaqSchema([]);
  const emptyQuestions = emptySchema.mainEntity as Array<unknown>;
  assert(
    emptyQuestions.length === 0,
    'Empty array should return schema with empty mainEntity'
  );

  console.log('\n✓ buildFaqSchema: all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Final Summary
// ---------------------------------------------------------------------------
console.log('\n✅ All schemaBuilders tests passed\n');
