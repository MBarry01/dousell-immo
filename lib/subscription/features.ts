/**
/**
 * Configuration des fonctionnalités et limites par plan (Feature Gating)
 * 
 * Ce fichier est la source unique de vérité pour les quotas et permissions SaaS.
 * Évitez de coder ces limites directement dans les composants ou actions.
 */

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface PlanFeatures {
    maxProperties: number;
    maxLeases: number;
    canInviteMembers: boolean;
    canExportData: boolean;
    canUseAdvancedReports: boolean;
    supportLevel: 'standard' | 'priority' | '24/7';
}

export const PLAN_FEATURES: Record<SubscriptionTier, PlanFeatures> = {
    starter: {
        maxProperties: 10,
        maxLeases: 10,
        canInviteMembers: false,
        canExportData: false,
        canUseAdvancedReports: false,
        supportLevel: 'standard',
    },
    pro: {
        maxProperties: Infinity,
        maxLeases: Infinity,
        canInviteMembers: true,
        canExportData: true,
        canUseAdvancedReports: false,
        supportLevel: 'priority',
    },
    enterprise: {
        maxProperties: Infinity,
        maxLeases: Infinity,
        canInviteMembers: true,
        canExportData: true,
        canUseAdvancedReports: true,
        supportLevel: '24/7',
    },
};

/**
 * Récupère les caractéristiques d'un plan
 */
export function getFeaturesForTier(tier: string | null | undefined): PlanFeatures {
    const normalizedTier = (tier?.toLowerCase() || 'starter') as SubscriptionTier;
    return PLAN_FEATURES[normalizedTier] || PLAN_FEATURES.starter;
}
