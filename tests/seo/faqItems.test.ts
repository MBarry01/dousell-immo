/**
 * FAQ Items Tests
 *
 * Tests the buildFaqItems pure function that generates FAQ question/answer pairs.
 * Designed to be a shared source of truth for both UI and JSON-LD schemas.
 *
 * Run with: npx tsx tests/seo/faqItems.test.ts
 */

import { buildFaqItems, FaqItem } from '@/lib/seo/faqItems';

// ---------------------------------------------------------------------------
// Helper: throw on failure
// ---------------------------------------------------------------------------
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

// ---------------------------------------------------------------------------
// Suite 1: buildFaqItems with global average and no pricing breakdown
// ---------------------------------------------------------------------------
console.log('\n=== buildFaqItems (global average, no breakdown) ===\n');

try {
  const items = buildFaqItems('Dakar', null, 50000000); // 50M XOF in centimes

  assert(Array.isArray(items), 'Should return an array');
  assert(items.length === 3, `Should return 3 items (got ${items.length})`);

  // Check first question (price question)
  const priceQuestion = items[0];
  assert(
    priceQuestion.question.includes('Dakar'),
    'Price question should include city name'
  );
  assert(
    priceQuestion.question.includes('prix moyen'),
    'Price question should ask about average price'
  );
  // Normalize whitespace for comparison (fr-FR uses non-breaking spaces)
  const normalizedAnswer = priceQuestion.answer.replace(/\s/g, ' ');
  assert(
    normalizedAnswer.includes('500 000'),
    'Price answer should include formatted price'
  );
  assert(
    priceQuestion.answer.includes('XOF'),
    'Price answer should include currency'
  );
  // When pricingBreakdown is null, the answer should not include the second sentence
  assert(
    !priceQuestion.answer.includes('Les prix varient'),
    'Without pricing breakdown, should not include variation sentence'
  );

  // Check second question (how to buy)
  const buyQuestion = items[1];
  assert(
    buyQuestion.question.includes('Comment acheter'),
    'Second question should be about buying'
  );
  assert(
    buyQuestion.question.includes('Dakar'),
    'Buying question should include city name'
  );
  assert(
    buyQuestion.answer.includes('Doussel Immo'),
    'Buying answer should mention Doussel Immo'
  );

  // Check third question (best time)
  const timeQuestion = items[2];
  assert(
    timeQuestion.question.includes('meilleure période'),
    'Third question should be about best time'
  );
  assert(
    timeQuestion.answer.includes('actif toute l\'année'),
    'Best time answer should mention year-round market'
  );

  console.log('\n✓ buildFaqItems (no breakdown): all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 2: buildFaqItems with pricing breakdown
// ---------------------------------------------------------------------------
console.log('\n=== buildFaqItems (with pricing breakdown) ===\n');

try {
  const pricingHTML =
    '<li>Studio: 10M</li><li>2-Pièces: 20M</li>';

  const items = buildFaqItems('Plateau', pricingHTML, 50000000);

  const priceQuestion = items[0];
  assert(
    priceQuestion.answer.includes('Les prix varient'),
    'With pricing breakdown, should include variation sentence'
  );
  assert(
    !priceQuestion.answer.includes(pricingHTML),
    'Pricing breakdown HTML should NOT be in answer (answer is plain text for JSON-LD)'
  );

  console.log('\n✓ buildFaqItems (with breakdown): all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 3: Price formatting
// ---------------------------------------------------------------------------
console.log('\n=== buildFaqItems (price formatting) ===\n');

try {
  // Test various price formats
  const testCases = [
    { prix: 1000000, expected: '10 000' }, // 10K XOF
    { prix: 100000000, expected: '1 000 000' }, // 1M XOF
    { prix: 500000, expected: '5 000' }, // 5K XOF
  ];

  for (const { prix, expected } of testCases) {
    const items = buildFaqItems('Dakar', null, prix);
    const answer = items[0].answer;
    // Normalize whitespace for comparison (fr-FR uses non-breaking spaces)
    const normalizedAnswer = answer.replace(/\s/g, ' ');
    assert(
      normalizedAnswer.includes(expected),
      `For ${prix} centimes, answer should include '${expected}' (got answer: ${answer})`
    );
  }

  console.log('\n✓ buildFaqItems (price formatting): all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Suite 4: City name in all questions
// ---------------------------------------------------------------------------
console.log('\n=== buildFaqItems (city name usage) ===\n');

try {
  const cities = ['Dakar', 'Thies', 'Kaolack'];

  for (const city of cities) {
    const items = buildFaqItems(city, null, 50000000);

    // First two questions should include city name
    assert(
      items[0].question.includes(city),
      `First question should include city "${city}"`
    );
    assert(
      items[1].question.includes(city),
      `Second question should include city "${city}"`
    );
  }

  console.log('\n✓ buildFaqItems (city usage): all assertions passed\n');
} catch (err) {
  console.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Final Summary
// ---------------------------------------------------------------------------
console.log('\n✅ All faqItems tests passed\n');
