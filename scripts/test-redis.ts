/**
 * 🧪 Test de Connexion Redis/Valkey pour Dousell Immo
 *
 * Ce script teste la connexion et les opérations de base :
 * - SET (écriture avec TTL)
 * - GET (lecture)
 * - EXISTS (vérification)
 * - DEL (suppression)
 *
 * Usage :
 *   npx tsx scripts/test-redis.ts
 */

import { redis } from '../lib/cache/redis-client';
import { getOrSetCache } from '../lib/cache/cache-aside';
import { withLock } from '../lib/cache/distributed-locks';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRedisConnection() {
  console.log('\n🧪 ==========================================');
  console.log('   TEST REDIS/VALKEY CONNECTION');
  console.log('   ==========================================\n');

  try {
    // --- Test 1 : SET ---
    console.log('📝 Test 1: SET with TTL');
    await redis.set('test:hello', 'world', 10);
    console.log('   ✅ SET test:hello = "world" (TTL: 10s)\n');

    // --- Test 2 : GET ---
    console.log('📖 Test 2: GET');
    const value = await redis.get('test:hello');
    console.log(`   ✅ GET test:hello = "${value}"\n`);

    if (value !== 'world') {
      throw new Error('Value mismatch!');
    }

    // --- Test 3 : EXISTS ---
    console.log('🔍 Test 3: EXISTS');
    const exists = await redis.exists('test:hello');
    console.log(`   ✅ EXISTS test:hello = ${exists}\n`);

    // --- Test 4 : DEL ---
    console.log('🗑️  Test 4: DELETE');
    await redis.del('test:hello');
    const afterDel = await redis.get('test:hello');
    console.log(`   ✅ DEL test:hello (value after: ${afterDel})\n`);

    console.log('🎉 Basic Redis Operations: SUCCESS\n');
  } catch (error: any) {
    console.error('❌ Redis connection test FAILED:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if Redis/Valkey is running');
    console.error('   2. Verify environment variables:');
    console.error('      - REDIS_URL (for local/server)');
    console.error('      - UPSTASH_REDIS_REST_URL (for Vercel)');
    console.error('   3. For local dev with Docker:');
    console.error('      docker run -d --name valkey -p 6379:6379 valkey/valkey\n');
    process.exit(1);
  }
}

async function testCacheAside() {
  console.log('🧪 ==========================================');
  console.log('   TEST CACHE-ASIDE PATTERN');
  console.log('   ==========================================\n');

  try {
    let dbCallCount = 0;

    const fetchFromDB = async () => {
      dbCallCount++;
      console.log(`   🐌 DB Call #${dbCallCount} (simulating 300ms latency...)`);
      await sleep(300);
      return { id: 123, name: 'Villa Dakar', price: 500000 };
    };

    // --- Test 1 : Cache MISS (first call) ---
    console.log('📝 Test 1: First call (should MISS and fetch from DB)');
    const start1 = Date.now();
    const result1 = await getOrSetCache('test_property_123', fetchFromDB, {
      ttl: 10,
      namespace: 'test',
      debug: true,
    });
    const duration1 = Date.now() - start1;
    console.log(`   ⏱️  Duration: ${duration1}ms`);
    console.log(`   📊 Result: ${JSON.stringify(result1)}\n`);

    // --- Test 2 : Cache HIT (second call) ---
    console.log('📖 Test 2: Second call (should HIT from cache)');
    const start2 = Date.now();
    const result2 = await getOrSetCache('test_property_123', fetchFromDB, {
      ttl: 10,
      namespace: 'test',
      debug: true,
    });
    const duration2 = Date.now() - start2;
    console.log(`   ⏱️  Duration: ${duration2}ms`);
    console.log(`   📊 Result: ${JSON.stringify(result2)}\n`);

    // --- Validation ---
    console.log('📊 Cache Performance Metrics:');
    console.log(`   - DB Calls: ${dbCallCount} (should be 1)`);
    console.log(`   - First call: ${duration1}ms (slow, DB)`);
    console.log(`   - Second call: ${duration2}ms (fast, cache)`);
    console.log(`   - Speedup: ${Math.round((duration1 / duration2) * 100) / 100}x faster\n`);

    if (dbCallCount !== 1) {
      throw new Error('Cache not working! DB called multiple times.');
    }

    if (duration2 > 50) {
      console.warn('⚠️  Cache hit slower than expected (>50ms)');
    }

    console.log('🎉 Cache-Aside Pattern: SUCCESS\n');
  } catch (error: any) {
    console.error('❌ Cache-Aside test FAILED:', error.message);
    process.exit(1);
  }
}

async function testDistributedLocks() {
  console.log('🧪 ==========================================');
  console.log('   TEST DISTRIBUTED LOCKS');
  console.log('   ==========================================\n');

  try {
    // --- Simuler un double-clic ---
    console.log('🖱️  Simulating double-click (concurrent payment)...\n');

    let paymentCount = 0;

    const processPayment = async (id: string) => {
      return withLock(
        `test_payment:${id}`,
        async () => {
          paymentCount++;
          console.log(`   💰 Payment #${paymentCount}: Processing...`);
          await sleep(1000); // Simule traitement long
          console.log(`   ✅ Payment #${paymentCount}: SUCCESS`);
          return { paymentId: `pay_${paymentCount}` };
        },
        { expireSeconds: 5, retries: 1 }
      );
    };

    // Lancer 2 paiements en même temps (race condition)
    const [result1, result2] = await Promise.all([
      processPayment('lease_123'),
      processPayment('lease_123'),
    ]);

    console.log('\n📊 Lock Test Results:');
    console.log(`   Payment 1: ${JSON.stringify(result1)}`);
    console.log(`   Payment 2: ${JSON.stringify(result2)}`);
    console.log(`   Total Payments Created: ${paymentCount}\n`);

    // Validation
    if (paymentCount !== 1) {
      throw new Error(`Lock failed! ${paymentCount} payments created instead of 1.`);
    }

    if (!result1.success && !result2.success) {
      throw new Error('Both payments failed! Lock too aggressive.');
    }

    const successCount = [result1, result2].filter((r) => r.success).length;
    const failCount = [result1, result2].filter((r) => !r.success).length;

    console.log('📊 Lock Protection Metrics:');
    console.log(`   - Successful: ${successCount} (should be 1)`);
    console.log(`   - Blocked: ${failCount} (should be 1)`);
    console.log(`   - Double Payment Prevention: ✅ WORKING\n`);

    console.log('🎉 Distributed Locks: SUCCESS\n');
  } catch (error: any) {
    console.error('❌ Distributed Locks test FAILED:', error.message);
    process.exit(1);
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Redis/Valkey Tests for Dousell Immo\n');

  try {
    await testRedisConnection();
    await testCacheAside();
    await testDistributedLocks();

    console.log('🎉 ==========================================');
    console.log('   ALL TESTS PASSED! ');
    console.log('   Redis/Valkey is ready for production.');
    console.log('   ==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test suite failed. See errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
