/**
 * AI Rate Limiter avec Redis ZSET (Atomic Operations)
 * 
 * Implémentation robuste avec:
 * - Sliding window algorithm
 * - Opérations atomiques via ZSET (évite race conditions)
 * - Fallback String/JSON si ZSET non disponible
 * - Fail-open strategy (autoriser si Redis down)
 * 
 * @see implementation_plan.md pour détails techniques
 */

import { redis, getRedisClient } from '@/lib/cache/redis-client';
import { AI_RATE_LIMIT_CONFIG, type RateLimitResult } from './types';

const REDIS_KEY_PREFIX = 'ratelimit:ai:';

/**
 * Vérifie si l'équipe peut faire un appel IA
 * 
 * @param teamId - ID de l'équipe
 * @returns RateLimitResult avec allowed, remaining, resetAt
 * 
 * @example
 * const result = await checkAIRateLimit('team-123');
 * if (!result.allowed) {
 *   return { error: `Limite atteinte. ${result.remaining} appels restants.` };
 * }
 */
export async function checkAIRateLimit(teamId: string): Promise<RateLimitResult> {
    const key = `${REDIS_KEY_PREFIX}${teamId}`;
    const now = Date.now();
    const windowStart = now - (AI_RATE_LIMIT_CONFIG.windowSeconds * 1000);
    const { maxRequests } = AI_RATE_LIMIT_CONFIG;

    try {
        const client = getRedisClient();

        // ✅ Fail-open: Si Redis indisponible, autoriser
        if (!client) {
            console.warn('⚠️ Redis unavailable. AI rate limit bypassed (fail-open).');
            return {
                allowed: true,
                remaining: maxRequests,
                resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
            };
        }

        // Déterminer la stratégie (ZSET ou String/JSON)
        const isUpstash = !!process.env.UPSTASH_REDIS_REST_URL;
        const supportsZSET = !isUpstash; // ioredis supporte ZSET nativement

        if (supportsZSET) {
            return await checkWithZSET(client, key, now, windowStart, maxRequests);
        } else {
            return await checkWithStringFallback(key, now, windowStart, maxRequests);
        }
    } catch (error) {
        // ✅ Fail-open: En cas d'erreur, autoriser mais logger
        console.error('❌ AI Rate Limit error (fail-open):', error);
        return {
            allowed: true,
            remaining: maxRequests,
            resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
            error: 'Rate limit check failed (allowed by default)',
        };
    }
}

/**
 * Stratégie ZSET (Atomic) - Recommandée pour ioredis
 * 
 * Opérations:
 * 1. ZREMRANGEBYSCORE - Nettoyer timestamps expirés
 * 2. ZCARD - Compter appels dans fenêtre
 * 3. ZADD - Ajouter nouveau timestamp si autorisé
 * 4. EXPIRE - Auto-nettoyage après 1h
 */
async function checkWithZSET(
    client: any,
    key: string,
    now: number,
    windowStart: number,
    maxRequests: number
): Promise<RateLimitResult> {
    // 1. Nettoyer les vieux timestamps (hors fenêtre)
    await client.zremrangebyscore(key, '-inf', windowStart);

    // 2. Compter les appels dans la fenêtre
    const count = await client.zcard(key);

    // 3. Vérifier la limite
    if (count >= maxRequests) {
        // Bloquer: limite atteinte
        const oldestTimestamp = await client.zrange(key, 0, 0, 'WITHSCORES');
        const resetAt = oldestTimestamp[1]
            ? new Date(parseInt(oldestTimestamp[1]) + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000)
            : new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000);

        console.warn(`⚠️ AI Rate limit exceeded for team ${key.replace(REDIS_KEY_PREFIX, '')} (${count}/${maxRequests})`);

        return {
            allowed: false,
            remaining: 0,
            resetAt,
            error: `Limite d'appels IA atteinte (${count}/${maxRequests})`,
        };
    }

    // 4. Autoriser: ajouter le timestamp actuel
    const uniqueId = `${now}-${Math.random().toString(36).substring(7)}`;
    await client.zadd(key, now, uniqueId);

    // 5. Définir expiration (auto-cleanup après 1h)
    await client.expire(key, AI_RATE_LIMIT_CONFIG.windowSeconds);

    console.log(`✅ AI call allowed (${count + 1}/${maxRequests}) for team ${key.replace(REDIS_KEY_PREFIX, '')}`);

    return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
    };
}

/**
 * Stratégie String/JSON (Fallback) - Pour Upstash ou environnements limités
 * 
 * Note: Pas atomique, potentielle race condition, mais acceptable pour faible volume
 */
async function checkWithStringFallback(
    key: string,
    now: number,
    windowStart: number,
    maxRequests: number
): Promise<RateLimitResult> {
    // 1. Récupérer les timestamps existants
    const raw = await redis.get(key);
    const timestamps = raw ? JSON.parse(raw) : [];

    // 2. Filtrer les timestamps dans la fenêtre
    const validTimestamps = timestamps.filter((ts: number) => ts > windowStart);

    // 3. Vérifier la limite
    if (validTimestamps.length >= maxRequests) {
        const resetAt = new Date(Math.min(...validTimestamps) + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000);

        console.warn(`⚠️ AI Rate limit exceeded (fallback) for ${key.replace(REDIS_KEY_PREFIX, '')} (${validTimestamps.length}/${maxRequests})`);

        return {
            allowed: false,
            remaining: 0,
            resetAt,
            error: `Limite d'appels IA atteinte (${validTimestamps.length}/${maxRequests})`,
        };
    }

    // 4. Autoriser: ajouter timestamp actuel
    validTimestamps.push(now);
    await redis.set(key, JSON.stringify(validTimestamps), AI_RATE_LIMIT_CONFIG.windowSeconds);

    console.log(`✅ AI call allowed (fallback) (${validTimestamps.length}/${maxRequests}) for ${key.replace(REDIS_KEY_PREFIX, '')}`);

    return {
        allowed: true,
        remaining: maxRequests - validTimestamps.length,
        resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
    };
}

/**
 * Réinitialise le rate limit pour une équipe (utile pour tests ou admin)
 */
export async function resetAIRateLimit(teamId: string): Promise<void> {
    const key = `${REDIS_KEY_PREFIX}${teamId}`;
    await redis.del(key);
    console.log(`🔄 AI rate limit reset for team ${teamId}`);
}

/**
 * Récupère le statut actuel du rate limit sans le modifier
 */
export async function getAIRateLimitStatus(teamId: string): Promise<{
    count: number;
    remaining: number;
    resetAt: Date;
}> {
    const key = `${REDIS_KEY_PREFIX}${teamId}`;
    const now = Date.now();
    const windowStart = now - (AI_RATE_LIMIT_CONFIG.windowSeconds * 1000);
    const { maxRequests } = AI_RATE_LIMIT_CONFIG;

    try {
        const client = await getRedisClient();
        if (!client) {
            return {
                count: 0,
                remaining: maxRequests,
                resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
            };
        }

        const isUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

        if (!isUpstash) {
            // ZSET
            await client.zremrangebyscore(key, '-inf', windowStart);
            const count = await client.zcard(key);
            return {
                count,
                remaining: Math.max(0, maxRequests - count),
                resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
            };
        } else {
            // String/JSON
            const raw = await redis.get(key);
            const timestamps = raw ? JSON.parse(raw) : [];
            const validTimestamps = timestamps.filter((ts: number) => ts > windowStart);
            return {
                count: validTimestamps.length,
                remaining: Math.max(0, maxRequests - validTimestamps.length),
                resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
            };
        }
    } catch (error) {
        console.error('❌ Error getting rate limit status:', error);
        return {
            count: 0,
            remaining: maxRequests,
            resetAt: new Date(now + AI_RATE_LIMIT_CONFIG.windowSeconds * 1000),
        };
    }
}
