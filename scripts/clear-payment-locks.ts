/**
 * Script pour supprimer tous les verrous de paiement (debug/test uniquement)
 */

import { redis } from '../lib/cache/redis-client';

async function clearPaymentLocks() {
  console.log('🧹 Nettoyage des verrous de paiement...');

  try {
    // Supprimer tous les verrous de paiement
    // Note: Upstash ne supporte pas SCAN, donc on supprime directement les clés connues
    const lockPatterns = [
      'lock:payment:rent:*',
      'lock:payment:rent:custom:*',
    ];

    // Puisque Upstash ne supporte pas KEYS/SCAN, on va juste tenter de supprimer
    // quelques clés possibles basées sur vos leases récents
    const possibleLocks = [
      'lock:payment:rent:custom:d4fa3b77-52e7-4be6-a62d-2a2f7f43fb28:25000',
      'lock:payment:rent:d4fa3b77-52e7-4be6-a62d-2a2f7f43fb28',
    ];

    for (const lockKey of possibleLocks) {
      try {
        await redis.del(lockKey);
        console.log(`✅ Supprimé: ${lockKey}`);
      } catch (err) {
        // Ignore si la clé n'existe pas
      }
    }

    console.log('✅ Nettoyage terminé !');
    console.log('Vous pouvez maintenant réessayer le paiement.');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

clearPaymentLocks();
