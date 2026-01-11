/**
 * Script pour vider le cache de gestion locative
 * Usage: npx tsx scripts/clear-rental-cache.ts
 */

import { config } from 'dotenv';

// Charger .env.local en priorité
config({ path: '.env.local' });

async function clearRentalCache() {
  console.log('🧹 Nettoyage du cache de gestion locative...\n');

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error('❌ Variables UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN requises');
    console.log('Trouvé:', {
      url: UPSTASH_URL ? '✅ défini' : '❌ manquant',
      token: UPSTASH_TOKEN ? '✅ défini' : '❌ manquant'
    });
    process.exit(1);
  }

  try {
    console.log('📡 Connexion à Upstash Redis...');

    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });

    // Scanner toutes les clés rentals:*
    const keysToDelete: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, { match: 'rentals:*', count: 100 });
      cursor = result[0] as number;
      const keys = result[1] as string[];
      keysToDelete.push(...keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      console.log(`\n🗑️ Suppression de ${keysToDelete.length} clés...\n`);

      // Supprimer par lots de 10 pour éviter les timeouts
      for (let i = 0; i < keysToDelete.length; i += 10) {
        const batch = keysToDelete.slice(i, i + 10);
        await redis.del(...batch);
      }

      console.log('✅ Cache vidé avec succès!\n');
      console.log('Clés supprimées:');
      keysToDelete.forEach(k => console.log(`  - ${k}`));
    } else {
      console.log('ℹ️ Aucune clé de cache rentals:* trouvée.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }

  console.log('\n🎉 Terminé! Rechargez la page pour voir les données fraîches.');
  process.exit(0);
}

clearRentalCache();
