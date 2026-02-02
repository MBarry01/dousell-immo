/**
 * Script de test manuel du Rate Limiter IA
 * 
 * Usage:
 *   npx tsx scripts/test-ai-ratelimit.ts
 * 
 * Prérequis:
 *   - Redis/Valkey actif: docker compose up valkey -d
 *   - Ou Upstash configuré
 */

import { checkAIRateLimit, resetAIRateLimit, getAIRateLimitStatus } from '../lib/rate-limit';

const TEST_TEAM_ID = 'manual-test-team';

async function testRateLimit() {
    console.log('🧪 Test du Rate Limiter IA\n');
    console.log('═'.repeat(50));

    // Reset au début
    await resetAIRateLimit(TEST_TEAM_ID);
    console.log(`✅ Reset effectué pour team: ${TEST_TEAM_ID}\n`);

    // Test 1: Vérifier les 20 premiers appels
    console.log('📝 Test 1: Les 20 premiers appels doivent passer...');
    for (let i = 1; i <= 20; i++) {
        const result = await checkAIRateLimit(TEST_TEAM_ID);

        if (!result.allowed) {
            console.error(`❌ Appel ${i}/20 bloqué (ne devrait pas) !`);
            process.exit(1);
        }

        console.log(`  ✅ Appel ${i}/20 - Restants: ${result.remaining}`);
    }

    console.log('\n');

    // Test 2: Le 21ème doit être bloqué
    console.log('📝 Test 2: Le 21ème appel doit être bloqué...');
    const blockedResult = await checkAIRateLimit(TEST_TEAM_ID);

    if (blockedResult.allowed) {
        console.error('❌ Le 21ème appel a été autorisé (ne devrait pas) !');
        process.exit(1);
    }

    console.log(`  ✅ Appel bloqué correctement`);
    console.log(`  📊 Erreur: ${blockedResult.error}`);
    console.log(`  ⏰ Reset dans: ${Math.ceil((blockedResult.resetAt.getTime() - Date.now()) / 60000)} minutes\n`);

    // Test 3: Vérifier le statut
    console.log('📝 Test 3: Vérifier le statut actuel...');
    const status = await getAIRateLimitStatus(TEST_TEAM_ID);
    console.log(`  📊 Appels utilisés: ${status.count}/20`);
    console.log(`  📊 Appels restants: ${status.remaining}`);
    console.log(`  ⏰ Reset prévu: ${status.resetAt.toLocaleString('fr-FR')}\n`);

    // Cleanup
    await resetAIRateLimit(TEST_TEAM_ID);
    console.log('✅ Cleanup effectué\n');

    console.log('═'.repeat(50));
    console.log('✅ Tous les tests sont passés !');
    console.log('🎉 Le rate limiter fonctionne correctement.\n');
}

// Exécuter les tests
testRateLimit().catch((error) => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
});
