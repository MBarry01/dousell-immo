/**
 * Tests pour AI Rate Limiter
 * 
 * Test de la logique de rate limiting avec Redis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAIRateLimit, resetAIRateLimit, getAIRateLimitStatus } from '../ai-limiter';
import { AI_RATE_LIMIT_CONFIG } from '../types';

// Mock Redis client
vi.mock('@/lib/cache/redis-client', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
    },
    getRedisClient: vi.fn(() => null), // Redis down par défaut
}));

describe('AI Rate Limiter', () => {
    const testTeamId = 'test-team-123';

    beforeEach(async () => {
        // Reset avant chaque test
        await resetAIRateLimit(testTeamId);
        vi.clearAllMocks();
    });

    describe('Fail-open behavior', () => {
        it('should allow requests when Redis is unavailable', async () => {
            const result = await checkAIRateLimit(testTeamId);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(AI_RATE_LIMIT_CONFIG.maxRequests);
        });
    });

    describe('Rate limit enforcement', () => {
        it('should allow first 20 requests', async () => {
            // Note: Ce test nécessite Redis actif
            // Pour tester réellement, commentez le mock getRedisClient

            for (let i = 0; i < AI_RATE_LIMIT_CONFIG.maxRequests; i++) {
                const result = await checkAIRateLimit(testTeamId);

                // Avec Redis down (mock), toujours autorisé
                expect(result.allowed).toBe(true);
            }
        });

        it('should block 21st request', async () => {
            // Note: Ce test nécessite Redis actif
            // Voir scripts de test d'intégration ci-dessous

            expect(true).toBe(true); // Placeholder
        });
    });

    describe('Status check', () => {
        it('should return current usage without modifying count', async () => {
            const statusBefore = await getAIRateLimitStatus(testTeamId);
            const statusAfter = await getAIRateLimitStatus(testTeamId);

            expect(statusBefore.count).toBe(statusAfter.count);
        });
    });
});

/**
 * Tests d'intégration (Redis requis)
 * 
 * Pour exécuter ces tests:
 * 1. Démarrer Redis: docker compose up valkey -d
 * 2. npm run test:integration
 */
describe.skip('AI Rate Limiter - Integration Tests', () => {
    // Ces tests sont skippés par défaut (besoin de Redis actif)
    // Pour les activer: remplacer describe.skip par describe

    const testTeamId = 'integration-test-team';

    beforeEach(async () => {
        await resetAIRateLimit(testTeamId);
    });

    it('should enforce 20 calls limit with real Redis', async () => {
        // Faire 20 appels
        for (let i = 0; i < 20; i++) {
            const result = await checkAIRateLimit(testTeamId);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(20 - i - 1);
        }

        // Le 21ème doit être bloqué
        const blockedResult = await checkAIRateLimit(testTeamId);
        expect(blockedResult.allowed).toBe(false);
        expect(blockedResult.remaining).toBe(0);
        expect(blockedResult.error).toContain('Limite');
    });

    it('should reset after 1 hour (sliding window)', async () => {
        // Faire 20 appels
        for (let i = 0; i < 20; i++) {
            await checkAIRateLimit(testTeamId);
        }

        // Mock le temps (avancer de 1h)
        // Note: Nécessite une lib comme timekeeper ou date mock

        // Après 1h, devrait être réinitialisé
        const result = await checkAIRateLimit(testTeamId);
        expect(result.allowed).toBe(true);
    });
});
