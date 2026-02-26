/**
 * Verrous Distribués (Distributed Locks) pour Dousel
 *
 * Cas d'usage :
 * - Paiement de loyer (éviter double paiement)
 * - Réservation de visite (éviter double booking)
 * - Génération de contrat (éviter doublons)
 *
 * Implémentation simplifiée de Redlock :
 * @see https://redis.io/docs/latest/develop/use/patterns/distributed-locks/
 */

import { redis } from './redis-client';

export interface LockOptions {
  /**
   * Durée max du verrou en secondes
   * @default 10
   */
  expireSeconds?: number;

  /**
   * Nombre de tentatives si verrou occupé
   * @default 3
   */
  retries?: number;

  /**
   * Délai entre chaque tentative (ms)
   * @default 100
   */
  retryDelay?: number;
}

/**
 * 🔒 Acquérir un verrou distribué
 *
 * Utilisation :
 * ```ts
 * const hasLock = await acquireLock('payment:lease123', { expireSeconds: 30 });
 * if (!hasLock) {
 *   return { error: "Paiement déjà en cours" };
 * }
 * ```
 *
 * @returns true si verrou acquis, false si déjà pris
 */
export async function acquireLock(
  key: string,
  options: LockOptions = {}
): Promise<boolean> {
  const { expireSeconds = 10, retries = 3, retryDelay = 100 } = options;

  const lockKey = `lock:${key}`;
  const lockValue = `${Date.now()}-${Math.random()}`; // Token unique

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // SETNX atomique : Set If Not Exists
      // Cette opération est atomique, donc thread-safe
      const acquired = await redis.setnx(lockKey, lockValue, expireSeconds);

      if (acquired) {
        console.log(`🔒 LOCK ACQUIRED: ${lockKey} (expire in ${expireSeconds}s)`);
        return true;
      }

      // Verrou occupé, on attend avant de réessayer
      if (attempt < retries - 1) {
        console.log(`⏳ Lock busy: ${lockKey}, retry ${attempt + 1}/${retries}`);
        await sleep(retryDelay);
      }
    } catch (error) {
      console.error(`Lock acquire error for ${lockKey}:`, error);
      return false;
    }
  }

  console.warn(`❌ LOCK FAILED: ${lockKey} (max retries reached)`);
  return false;
}

/**
 * 🔓 Relâcher un verrou distribué
 *
 * IMPORTANT : Toujours appeler dans un bloc finally
 * ```ts
 * try {
 *   // ... traitement ...
 * } finally {
 *   await releaseLock('payment:lease123');
 * }
 * ```
 */
export async function releaseLock(key: string): Promise<void> {
  const lockKey = `lock:${key}`;

  try {
    await redis.del(lockKey);
    console.log(`🔓 LOCK RELEASED: ${lockKey}`);
  } catch (error) {
    console.error(`Lock release error for ${lockKey}:`, error);
  }
}

/**
 * 🛡️ Wrapper avec auto-release (Pattern "Safe Lock")
 *
 * Gère automatiquement l'acquisition et la libération du verrou.
 * Recommandé pour éviter les oublis.
 *
 * Utilisation :
 * ```ts
 * const result = await withLock('payment:lease123', async () => {
 *   // Code protégé par verrou
 *   await processPayment(leaseId);
 *   return { success: true };
 * }, { expireSeconds: 30 });
 *
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * ```
 */
export async function withLock<T>(
  key: string,
  handler: () => Promise<T>,
  options: LockOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const hasLock = await acquireLock(key, options);

  if (!hasLock) {
    return {
      success: false,
      error: 'Opération déjà en cours. Veuillez patienter.',
    };
  }

  try {
    const data = await handler();
    return { success: true, data };
  } catch (error: any) {
    console.error(`Lock handler error for ${key}:`, error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue',
    };
  } finally {
    // TOUJOURS relâcher le verrou, même si ça plante
    await releaseLock(key);
  }
}

/**
 * 🔍 Vérifier si un verrou existe (debug)
 */
export async function isLocked(key: string): Promise<boolean> {
  const lockKey = `lock:${key}`;

  try {
    return await redis.exists(lockKey);
  } catch (error) {
    console.error(`Lock check error for ${lockKey}:`, error);
    return false;
  }
}

// --- Helpers ---
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
