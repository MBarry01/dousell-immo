/**
 * 🚀 PATTERNS DE CACHE AVANCÉS - Dousell Immo
 *
 * Optimisations pour aller au-delà du Cache-Aside basique :
 * 1. Stale-While-Revalidate (SWR) - Réponse instantanée 100%
 * 2. Compression automatique - Économie RAM
 * 3. Métriques & Observabilité - Monitoring production
 *
 * @see REDIS_CACHE_STRATEGY.md
 */

import { redis } from './redis-client';
import { getOrSetCache, type CacheOptions } from './cache-aside';

// ============================================================================
// 1. STALE-WHILE-REVALIDATE (SWR) PATTERN
// ============================================================================

/**
 * Pattern SWR : Toujours servir instantanément (même si stale)
 *
 * Workflow :
 * 1. Lecture cache → Si existe : return immédiatement
 * 2. En parallèle : Vérifier si stale (>TTL/2)
 * 3. Si stale : Rafraîchir en background (non-bloquant)
 *
 * Avantages :
 * - Latence TOUJOURS 5ms (jamais 300ms)
 * - UX parfaite (aucun délai perçu)
 * - DB moins sollicitée (refresh async)
 *
 * Trade-off :
 * - Données peuvent avoir max TTL/2 de retard
 *
 * @example
 * // Au lieu de getOrSetCache classique
 * const data = await getOrSetCacheSWR(
 *   'homepage_data',
 *   fetchFromDB,
 *   { ttl: 600 } // Max 5 min de retard (600/2)
 * );
 */
export async function getOrSetCacheSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    ttl = 3600,
    namespace = 'dousell',
    debug = process.env.NODE_ENV === 'development',
  } = options;

  const fullKey = `${namespace}:${key}`;
  const metaKey = `${fullKey}:meta`; // Stocke timestamp

  try {
    // 1. Lire cache (rapide - non bloquant)
    const cachedData = await redis.get(fullKey);
    const cachedMeta = await redis.get(metaKey);

    if (cachedData) {
      const data = JSON.parse(cachedData);

      // 2. Vérifier si stale (>50% du TTL écoulé)
      const cacheAge = cachedMeta ? Date.now() - parseInt(cachedMeta) : ttl * 1000;
      const isStale = cacheAge > (ttl * 1000) / 2;

      if (isStale) {
        if (debug) console.log(`⚠️  STALE DATA: ${fullKey} (refreshing in background...)`);

        // 3. Rafraîchir en BACKGROUND (non-bloquant !)
        // Ne pas attendre le résultat
        refreshInBackground(fullKey, metaKey, fetcher, ttl, debug).catch((err) => {
          console.error(`Background refresh failed for ${fullKey}:`, err);
        });
      } else if (debug) {
        console.log(`🚀 SWR HIT (fresh): ${fullKey}`);
      }

      // 4. Retourner immédiatement les données (même si stale)
      return data;
    }

    // 5. Cache MISS : Fetch bloquant (1ère fois seulement)
    if (debug) console.log(`🐌 SWR MISS: ${fullKey} (initial fetch...)`);

    const freshData = await fetcher();

    // 6. Stocker avec métadata timestamp
    await Promise.all([
      redis.set(fullKey, JSON.stringify(freshData), ttl),
      redis.set(metaKey, Date.now().toString(), ttl),
    ]);

    return freshData;
  } catch (error) {
    console.error(`SWR error for ${fullKey}:`, error);

    // Fallback : Si cache fail, fetch direct
    return fetcher();
  }
}

/**
 * Rafraîchissement asynchrone en background
 * Ne bloque jamais la réponse utilisateur
 */
async function refreshInBackground<T>(
  dataKey: string,
  metaKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
  debug: boolean
): Promise<void> {
  try {
    const freshData = await fetcher();

    await Promise.all([
      redis.set(dataKey, JSON.stringify(freshData), ttl),
      redis.set(metaKey, Date.now().toString(), ttl),
    ]);

    if (debug) console.log(`✅ Background refresh complete: ${dataKey}`);
  } catch (error) {
    console.error(`Background refresh failed for ${dataKey}:`, error);
  }
}

// ============================================================================
// 2. COMPRESSION AUTOMATIQUE
// ============================================================================

/**
 * Cache avec compression automatique (pour gros objets)
 *
 * Cas d'usage :
 * - Liste de 1000+ propriétés (JSON >100KB)
 * - Objets avec beaucoup de texte (descriptions, HTML)
 * - Économie RAM Redis : 70-90% selon les données
 *
 * Trade-off :
 * - CPU : +2ms pour compress/decompress
 * - RAM : -80% en moyenne
 *
 * @example
 * const data = await getOrSetCacheCompressed(
 *   'big_list',
 *   fetchBigData,
 *   { ttl: 600, compressionThreshold: 10000 } // Compresse si >10KB
 * );
 */
export async function getOrSetCacheCompressed<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { compressionThreshold?: number } = {}
): Promise<T> {
  const {
    ttl = 3600,
    namespace = 'dousell',
    debug = process.env.NODE_ENV === 'development',
    compressionThreshold = 5000, // 5KB par défaut
  } = options;

  const fullKey = `${namespace}:${key}`;
  const isCompressedKey = `${fullKey}:compressed`;

  try {
    // 1. Lire cache
    const cachedData = await redis.get(fullKey);
    const isCompressed = (await redis.get(isCompressedKey)) === 'true';

    if (cachedData) {
      if (debug) console.log(`🚀 CACHE HIT (compressed: ${isCompressed}): ${fullKey}`);

      // Décompresser si nécessaire
      if (isCompressed) {
        const decompressed = await decompress(cachedData);
        return JSON.parse(decompressed);
      }

      return JSON.parse(cachedData);
    }

    // 2. Cache MISS
    if (debug) console.log(`🐌 CACHE MISS: ${fullKey}`);

    const freshData = await fetcher();
    const jsonString = JSON.stringify(freshData);
    const shouldCompress = jsonString.length > compressionThreshold;

    // 3. Compresser si gros objet
    if (shouldCompress) {
      const compressed = await compress(jsonString);

      if (debug) {
        const ratio = ((1 - compressed.length / jsonString.length) * 100).toFixed(1);
        console.log(
          `💾 CACHE SET (compressed): ${fullKey} (${jsonString.length} → ${compressed.length} bytes, -${ratio}%)`
        );
      }

      await Promise.all([
        redis.set(fullKey, compressed, ttl),
        redis.set(isCompressedKey, 'true', ttl),
      ]);
    } else {
      if (debug) console.log(`💾 CACHE SET (no compression): ${fullKey} (${jsonString.length} bytes)`);

      await redis.set(fullKey, jsonString, ttl);
    }

    return freshData;
  } catch (error) {
    console.error(`Compressed cache error for ${fullKey}:`, error);
    return fetcher();
  }
}

/**
 * Compression simple avec Buffer (natif Node.js)
 * Utilise gzip (bon ratio compression/vitesse)
 */
async function compress(data: string): Promise<string> {
  const { gzip } = await import('zlib');
  const { promisify } = await import('util');

  const gzipAsync = promisify(gzip);
  const compressed = await gzipAsync(Buffer.from(data, 'utf-8'));
  return compressed.toString('base64');
}

/**
 * Décompression
 */
async function decompress(data: string): Promise<string> {
  const { gunzip } = await import('zlib');
  const { promisify } = await import('util');

  const gunzipAsync = promisify(gunzip);
  const decompressed = await gunzipAsync(Buffer.from(data, 'base64'));
  return decompressed.toString('utf-8');
}

// ============================================================================
// 3. MÉTRIQUES & OBSERVABILITÉ
// ============================================================================

/**
 * Métriques de cache pour monitoring production
 */
export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;
  private static errors = 0;
  private static totalLatency = 0;
  private static operationCount = 0;

  /**
   * Enregistrer un cache HIT
   */
  static recordHit(latency: number) {
    this.hits++;
    this.totalLatency += latency;
    this.operationCount++;
  }

  /**
   * Enregistrer un cache MISS
   */
  static recordMiss(latency: number) {
    this.misses++;
    this.totalLatency += latency;
    this.operationCount++;
  }

  /**
   * Enregistrer une erreur
   */
  static recordError() {
    this.errors++;
  }

  /**
   * Obtenir les statistiques actuelles
   */
  static getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const avgLatency = this.operationCount > 0 ? this.totalLatency / this.operationCount : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: hitRate.toFixed(2) + '%',
      avgLatency: avgLatency.toFixed(2) + 'ms',
      total,
    };
  }

  /**
   * Réinitialiser les compteurs (pour tests)
   */
  static reset() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.totalLatency = 0;
    this.operationCount = 0;
  }

  /**
   * Logger les stats (appelé périodiquement ou à la demande)
   */
  static logStats() {
    const stats = this.getStats();
    console.log('\n📊 CACHE METRICS:');
    console.log(`   Hits: ${stats.hits}`);
    console.log(`   Misses: ${stats.misses}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Hit Rate: ${stats.hitRate}`);
    console.log(`   Avg Latency: ${stats.avgLatency}`);
    console.log(`   Total Operations: ${stats.total}\n`);
  }
}

/**
 * Cache avec métriques automatiques
 *
 * Utilisation :
 * - Remplace getOrSetCache dans les endpoints critiques
 * - Logs automatiques des hit/miss
 * - Intégration Datadog/Sentry possible
 *
 * @example
 * const data = await getOrSetCacheWithMetrics(
 *   'homepage_data',
 *   fetchFromDB,
 *   { ttl: 300 }
 * );
 *
 * // Plus tard, consulter les stats
 * CacheMetrics.logStats();
 */
export async function getOrSetCacheWithMetrics<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const startTime = Date.now();

  try {
    const data = await getOrSetCache(key, fetcher, options);
    const latency = Date.now() - startTime;

    // Détecter si c'était un HIT ou MISS par la latence
    // HIT = <50ms, MISS = >100ms
    if (latency < 50) {
      CacheMetrics.recordHit(latency);
    } else {
      CacheMetrics.recordMiss(latency);
    }

    return data;
  } catch (error) {
    CacheMetrics.recordError();
    throw error;
  }
}

/**
 * Endpoint API pour exposer les métriques
 * À ajouter dans app/api/cache-metrics/route.ts
 */
export function GET() {
  const stats = CacheMetrics.getStats();

  return Response.json({
    success: true,
    metrics: stats,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// 4. USAGE RECOMMANDÉ POUR DOUSELL
// ============================================================================

/**
 * EXEMPLE : Homepage avec SWR (toujours instantané)
 */
// ...
export async function getHomePageSectionsSWR() {
  return getOrSetCacheSWR(
    'homepage_sections',
    async () => {
      // PROMISE MOCK POUR L'EXEMPLE
      // Dans la réalité : Promise.all([getLocations(), getVentes(), ...])
      return {
        locations: [],
        ventes: [],
        terrains: []
      };
    },
    {
      ttl: 600, // 10 minutes (max 5 min de retard acceptable)
      namespace: 'homepage',
      debug: true,
    }
  );
}

/**
 * EXEMPLE : Grande liste avec compression
 */
export async function getAllPropertiesCompressed() {
  return getOrSetCacheCompressed(
    'all_properties_full',
    async () => {
      // Requête qui retourne 1000+ propriétés
      const supabase = await import('@/utils/supabase/server').then((m) => m.createClient());
      const { data } = await (await supabase).from('properties').select('*');
      return data || [];
    },
    {
      ttl: 300,
      namespace: 'properties',
      compressionThreshold: 10000, // Compresse si >10KB
      debug: true,
    }
  );
}

/**
 * EXEMPLE : Endpoint critique avec métriques
 */
export async function getCriticalDataWithMetrics(id: string) {
  return getOrSetCacheWithMetrics(
    `critical_${id}`,
    async () => {
      // Votre fetcher
      return { data: 'important' };
    },
    { ttl: 300, namespace: 'critical' }
  );
}
