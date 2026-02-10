import { PLANS, PlanFeatures, SubscriptionTier } from './plans-config';

// ============================================================================
// RE-EXPORTS (Compatibilité)
// ============================================================================

export type { SubscriptionTier };
export type { PlanFeatures } from './plans-config';

/**
 * @deprecated Utilisez PLANS depuis plans-config.ts
 */
export const PLAN_FEATURES: Record<SubscriptionTier, PlanFeatures> = {
  starter: PLANS.starter.features,
  pro: PLANS.pro.features,
  enterprise: PLANS.enterprise.features,
};

/**
 * Récupère les caractéristiques d'un plan
 * @deprecated Utilisez getPlan(tier).features depuis plans-config.ts
 */
export function getFeaturesForTier(tier: string | null | undefined): PlanFeatures {
  const normalizedTier = (tier?.toLowerCase() || 'starter') as SubscriptionTier;

  // Validation
  if (!['starter', 'pro', 'enterprise'].includes(normalizedTier)) {
    return PLANS.starter.features;
  }

  return PLANS[normalizedTier].features;
}

// ============================================================================
// NOUVEAUX HELPERS (Forward depuis plans-config)
// ============================================================================

/**
 * Vérifie si un plan peut effectuer une action
 */
export { canPerformAction, getPlanLimits, exceedsLimit } from './plans-config';
