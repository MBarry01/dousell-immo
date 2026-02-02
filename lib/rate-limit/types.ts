/**
 * Rate Limiting Types
 * 
 * Types partagés pour tous les rate limiters de l'application
 */

export interface RateLimitResult {
    /** Si l'action est autorisée */
    allowed: boolean;

    /** Nombre d'appels restants dans la fenêtre */
    remaining: number;

    /** Date de réinitialisation du compteur */
    resetAt: Date;

    /** Message d'erreur si bloqué */
    error?: string;
}

export interface RateLimitConfig {
    /** Nombre maximum de requêtes */
    maxRequests: number;

    /** Taille de la fenêtre en secondes */
    windowSeconds: number;
}

/**
 * Configuration par défaut pour le rate limiting IA
 */
export const AI_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxRequests: 20, // Ajusté selon feedback (was 10)
    windowSeconds: 3600, // 1 heure
};
