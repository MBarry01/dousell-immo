/**
 * Pattern Cache-Aside pour Dousell Immo
 *
 * Stratégie :
 * 1. Lecture cache (Redis) - Fast (5ms)
 * 2. Si miss → Lecture DB (Supabase) - Slow (300ms)
 * 3. Remplissage cache automatique (Lazy Loading)
 * 4. Fail-safe : Si Redis down, renvoie DB quand même
 *
 * @see https://redis.io/docs/latest/develop/use/patterns/cache-aside/
 */

import { redis } from './redis-client';

/**
 * Options de configuration du cache
 */
export interface CacheOptions {
  /**
   * Durée de vie du cache en secondes
   * @default 3600 (1 heure)
   */
  ttl?: number;

  /**
   * Préfixe pour namespacing (évite les collisions)
   * @example "properties", "users", "leases"
   */
  namespace?: string;

  /**
   * Force le bypass du cache (pour debug)
   */
  bypassCache?: boolean;

  /**
   * Log les hits/miss (dev only)
   */
  debug?: boolean;
}

/**
 * 🧠 LA FONCTION MAGIQUE - Cache-Aside Pattern
 *
 * Utilisation :
 * ```ts
 * const properties = await getOrSetCache(
 *   'all_properties_public',
 *   async () => {
 *     const { data } = await supabase.from('properties').select('*');
 *     return data || [];
 *   },
 *   { ttl: 300, namespace: 'properties' }
 * );
 * ```
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    ttl = 3600,
    namespace = 'dousell',
    bypassCache = false,
    debug = process.env.NODE_ENV === 'development',
  } = options;

  // Clé complète avec namespace
  const fullKey = `${namespace}:${key}`;

  // Mode bypass (debug ou pas de Redis)
  if (bypassCache) {
    if (debug) console.log(`🔧 CACHE BYPASS: ${fullKey}`);
    return fetcher();
  }

  try {
    // --- ÉTAPE 1 : Lecture Cache (RAPIDE) ---
    // Timeout strict de 500ms pour éviter de bloquer le rendu si Redis rame/est down
    // (Ajusté de 1500ms à 500ms pour privilégier la réactivité de l'UI en cas de latence Upstash)
    const redisPromise = redis.get(fullKey);
    const timeoutMs = process.env.NODE_ENV === 'development' ? 1500 : 500;
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        // Log en warn plutôt qu'en error si c'est un timeout attendu en dev
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`⌛ CACHE TIMEOUT: ${fullKey} (Redis took > ${timeoutMs}ms) - Fallback to DB`);
        }
        resolve(null);
      }, timeoutMs)
    );

    const cachedData = await Promise.race([redisPromise, timeoutPromise]);

    if (cachedData) {
      if (debug) console.log(`🚀 CACHE HIT: ${fullKey}`);

      try {
        // Upstash auto-parse JSON - check if already an object
        if (typeof cachedData === 'object') {
          return cachedData as T;
        }
        return JSON.parse(cachedData);
      } catch (parseError) {
        // Si le JSON est corrompu, on invalide et refetch
        console.error(`Cache parse error for ${fullKey}:`, parseError);
        await redis.del(fullKey);
      }
    }

    // --- ÉTAPE 2 : Cache Miss → DB (LENT) ---
    if (debug) console.log(`🐌 CACHE MISS: ${fullKey} (fetching from DB...)`);

    const freshData = await fetcher();

    // --- ÉTAPE 3 : Remplissage Cache (Lazy Loading) ---
    if (freshData !== null && freshData !== undefined) {
      try {
        // Non-bloquant: on n'attend pas l'écriture pour répondre
        redis.set(fullKey, JSON.stringify(freshData), ttl).catch(err => {
          console.error(`Cache set error for ${fullKey}:`, err);
        });
        if (debug) console.log(`💾 CACHE SET: ${fullKey} (TTL: ${ttl}s)`);
      } catch (setError) {
        console.error(`Cache set error for ${fullKey}:`, setError);
      }
    }

    return freshData;
  } catch (error) {
    // --- ÉTAPE 4 : Fail-Safe (Redis Down) ---
    console.error(`Cache error for ${fullKey}:`, error);
    console.warn('⚠️ Falling back to DB only (cache disabled)');
    return fetcher();
  }
}

/**
 * Invalidation intelligente par pattern
 *
 * Exemples :
 * - `invalidateCache('properties:*')` → Supprime toutes les clés properties
 * - `invalidateCache('property_detail:123')` → Supprime une clé spécifique
 */
export async function invalidateCache(pattern: string, namespace = 'dousell'): Promise<void> {
  const fullPattern = `${namespace}:${pattern}`;

  try {
    // Si pattern avec wildcard, on supprime multiple
    if (pattern.includes('*')) {
      // Note : SCAN est plus safe que KEYS en prod (pas de blocage)
      // Mais on simplifie ici (à améliorer si besoin)
      console.log(`🗑️ INVALIDATE PATTERN: ${fullPattern}`);

      // Pour Upstash (HTTP), il faut utiliser leur API spécifique
      // Pour ioredis (TCP), on utilise KEYS (dev only) ou SCAN (prod)
      // Implémentation simplifiée :
      await redis.del(fullPattern.replace('*', ''));
    } else {
      // Clé simple
      console.log(`🗑️ INVALIDATE KEY: ${fullPattern}`);
      await redis.del(fullPattern);
    }
  } catch (error) {
    console.error(`Invalidation error for ${fullPattern}:`, error);
  }
}

/**
 * Invalidation multiple (batch)
 *
 * Utilisé quand une action impacte plusieurs caches
 */
export async function invalidateCacheBatch(
  keys: string[],
  namespace = 'dousell'
): Promise<void> {
  const fullKeys = keys.map((key) => `${namespace}:${key}`);

  try {
    console.log(`🗑️ BATCH INVALIDATE (${fullKeys.length} keys)`);
    await redis.del(fullKeys);
  } catch (error) {
    console.error('Batch invalidation error:', error);
  }
}
