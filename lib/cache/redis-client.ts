/**
 * Client Redis/Valkey unifié pour Dousell Immo
 *
 * Environnements supportés :
 * - Vercel (Serverless) : Upstash Redis via HTTP
 * - Serveur dédié : Valkey/Redis classique via TCP
 *
 * @see DESIGN_SYSTEM_UPGRADES.md pour pattern Cache-Aside
 */

// Type-safe pour les deux clients
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClient = any; // On typage plus tard

/**
 * Factory qui retourne le bon client selon l'environnement
 */
function createRedisClient(): RedisClient {
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';

  // --- CAS 1 : Vercel (Serverless) ---
  if (isVercel || process.env.UPSTASH_REDIS_REST_URL) {
    console.log('🚀 Using Upstash Redis (HTTP Serverless)');

    // Lazy import (évite l'erreur si package pas installé)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');

    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  // --- CAS 2 : Serveur Dédié (Valkey/Redis classique) ---
  if (process.env.REDIS_URL) {
    console.log('🏗️ Using Valkey/Redis (TCP Connection)');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    return new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  // --- CAS 3 : Dev Local (Docker Valkey) ---
  if (!isProduction) {
    console.log('💻 Using Local Valkey (Docker)');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    return new IORedis('redis://localhost:6379', {
      lazyConnect: true, // Ne plante pas si Redis absent en dev
    });
  }

  // --- CAS 4 : Fallback (Mode Dégradé - Pas de Cache) ---
  console.warn('⚠️ No Redis configured. Cache disabled (DB only).');
  return null;
}

// Singleton global (évite 50 connexions en dev)
let redisClient: RedisClient | null = null;

export function getRedisClient(): RedisClient | null {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * Wrapper unifié pour les deux types de clients
 */
export const redis = {
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      if (ttl) {
        // Upstash et ioredis ont des syntaxes différentes
        const isUpstash = process.env.UPSTASH_REDIS_REST_URL;

        if (isUpstash) {
          await client.set(key, value, { ex: ttl });
        } else {
          await client.set(key, value, 'EX', ttl);
        }
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  async del(key: string | string[]): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      const isUpstash = process.env.UPSTASH_REDIS_REST_URL;
      const keys = Array.isArray(key) ? key : [key];

      if (keys.length === 0) return;

      if (isUpstash) {
        // Upstash: del accepts spread args for multiple keys
        await client.del(...keys);
      } else {
        // ioredis: del can accept array or spread
        await client.del(...keys);
      }

      console.log(`🗑️ REDIS DEL: ${keys.length} key(s) deleted`);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },

  /**
   * SET if Not eXists (atomic operation for distributed locks)
   * @returns true if key was set, false if key already exists
   */
  async setnx(key: string, value: string, ttl?: number): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const isUpstash = process.env.UPSTASH_REDIS_REST_URL;

      if (isUpstash) {
        // Upstash: set with NX option
        const result = ttl
          ? await client.set(key, value, { ex: ttl, nx: true })
          : await client.set(key, value, { nx: true });
        return result === 'OK';
      } else {
        // ioredis: SET with NX flag
        if (ttl) {
          const result = await client.set(key, value, 'EX', ttl, 'NX');
          return result === 'OK';
        } else {
          const result = await client.setnx(key, value);
          return result === 1;
        }
      }
    } catch (error) {
      console.error('Redis SETNX error:', error);
      return false;
    }
  },
};

// Export du type pour TypeScript
export type { RedisClient };
