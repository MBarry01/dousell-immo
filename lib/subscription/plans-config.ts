/**
 * SOURCE UNIQUE DE VÉRITÉ - Configuration des Plans d'Abonnement
 *
 * Ce fichier centralise TOUTE la configuration des plans de Dousel.
 * Modifier uniquement ici pour propager partout (vitrine, SaaS, feature gating).
 *
 * @version 1.1.0 (Multi-currency support)
 * @lastUpdated 2026-02-10
 */

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

/**
 * Statuts d'abonnement - aligné avec la contrainte CHECK en base de données.
 * Source unique de vérité pour tout le projet.
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export type BillingCycle = 'monthly' | 'annual';

export type Currency = 'xof' | 'eur';

export interface PriceConfig {
  amount: number;
  priceId: string;
}

export interface PlanPricing {
  monthly: PriceConfig;
  annual: PriceConfig;
}

export interface MultiCurrencyPricing {
  xof: PlanPricing;
  eur: PlanPricing;
}

export interface PlanLimits {
  maxProperties: number;      // Nombre max de biens
  maxLeases: number;          // Nombre max de baux
  maxTenants: number;         // Nombre max de locataires
  maxTeamMembers: number;     // Nombre max de membres d'équipe
}

export interface PlanFeatures {
  // Limites
  limits: PlanLimits;

  // Capacités
  canInviteMembers: boolean;
  canExportData: boolean;
  canUseAdvancedReports: boolean;
  canManageInterventions: boolean; // Managed interventions module
  canUseAPI: boolean;
  canWhiteLabel: boolean;

  // Support
  supportLevel: 'standard' | 'priority' | '24/7';

  // Paiements
  paymentMethods: string[];
}

export interface Plan {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  pricing: MultiCurrencyPricing; // Changed to support XOF/EUR
  features: PlanFeatures;
  highlightedFeatures: string[];  // Pour affichage marketing
  popular?: boolean;
  ctaText: string;
}

// ============================================================================
// CONFIGURATION DES PLANS
// ============================================================================

export const PLANS: Record<SubscriptionTier, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Parfait pour les propriétaires débutants',
    pricing: {
      xof: {
        monthly: { amount: 15000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY_XOF! },
        annual: { amount: 144000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL_XOF! },
      },
      eur: {
        monthly: { amount: 23, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY_EUR! },
        annual: { amount: 220, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL_EUR! },
      },
    },
    features: {
      limits: {
        maxProperties: 15,
        maxLeases: 20,
        maxTenants: 30,
        maxTeamMembers: 1,
      },
      canInviteMembers: false,
      canExportData: true,
      canUseAdvancedReports: false,
      canManageInterventions: false,
      canUseAPI: false,
      canWhiteLabel: false,
      supportLevel: 'standard',
      paymentMethods: ['Wave', 'Orange Money', 'Carte Bancaire'],
    },
    highlightedFeatures: [
      "Jusqu'à 15 biens",
      "Gestion de 30 locataires maximum",
      "Paiements Wave/Orange Money",
      "Quittances automatiques",
      "Rappels d'échéance",
      "Support standard (email)",
    ],
    popular: false,
    ctaText: 'Choisir',
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    tagline: 'Idéal pour les agences en croissance',
    pricing: {
      xof: {
        monthly: { amount: 45000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_XOF! },
        annual: { amount: 432000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL_XOF! },
      },
      eur: {
        monthly: { amount: 68, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_EUR! },
        annual: { amount: 650, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL_EUR! },
      },
    },
    features: {
      limits: {
        maxProperties: 75,
        maxLeases: 9999, // Illimité
        maxTenants: 9999, // Illimité
        maxTeamMembers: 5,
      },
      canInviteMembers: true,
      canExportData: true,
      canUseAdvancedReports: true,
      canManageInterventions: true,
      canUseAPI: false,
      canWhiteLabel: false,
      supportLevel: 'priority',
      paymentMethods: ['Wave', 'Orange Money', 'Carte Bancaire', 'Virement'],
    },
    highlightedFeatures: [
      "Jusqu'à 75 biens",
      "Locataires illimités",
      "5 membres d'équipe",
      "Analyses financières avancées",
      "Gestion des incidents",
      "Support prioritaire (24h)",
    ],
    popular: true,
    ctaText: 'Commencer',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Pour les grandes structures immobilières',
    pricing: {
      xof: {
        monthly: { amount: 75000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_XOF! },
        annual: { amount: 720000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL_XOF! },
      },
      eur: {
        monthly: { amount: 115, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_EUR! },
        annual: { amount: 1100, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL_EUR! },
      },
    },
    features: {
      limits: {
        maxProperties: 9999, // Illimité
        maxLeases: 9999,
        maxTenants: 9999,
        maxTeamMembers: 9999, // Illimité
      },
      canInviteMembers: true,
      canExportData: true,
      canUseAdvancedReports: true,
      canManageInterventions: true,
      canUseAPI: true,
      canWhiteLabel: true,
      supportLevel: '24/7',
      paymentMethods: ['Wave', 'Orange Money', 'Carte Bancaire', 'Virement', 'Facturation'],
    },
    highlightedFeatures: [
      "Biens illimités",
      "Équipe illimitée",
      "API & Webhooks",
      "Authentification SSO",
      "Contrats personnalisés",
      "Support dédié 24/7",
    ],
    popular: false,
    ctaText: 'Contacter les ventes',
  },
};

// ============================================================================
// CONSTANTES & HELPERS
// ============================================================================

/**
 * Calcul de la réduction annuelle (%)
 */
export const ANNUAL_DISCOUNT_PERCENT = 20; // -20% = 2 mois offerts

/**
 * Durée de l'essai gratuit (en jours)
 */
export const TRIAL_DURATION_DAYS = 14;

/**
 * Récupère un plan par son ID
 */
export function getPlan(tier: SubscriptionTier): Plan {
  return PLANS[tier];
}

/**
 * Récupère tous les plans (dans l'ordre d'affichage)
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Calcule l'équivalent mensuel d'un prix annuel (pour l'affichage "12k/mois")
 */
export function getMonthlyEquivalent(annualAmount: number): number {
  return Math.round(annualAmount / 12);
}

/**
 * Calcule l'économie annuelle (en FCFA)
 */
export function getAnnualSavings(tier: SubscriptionTier, currency: Currency): number {
  const plan = PLANS[tier];
  const monthlyPrice = plan.pricing[currency].monthly.amount;
  const annualPrice = plan.pricing[currency].annual.amount;
  return (monthlyPrice * 12) - annualPrice;
}

/**
 * Formate un prix selon la devise
 */
export function formatPrice(amount: number, currency: Currency = 'xof'): string {
  if (currency === 'xof') {
    return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  } else {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}

/**
 * Vérifie si un plan peut effectuer une action donnée
 */
export function canPerformAction(
  tier: SubscriptionTier,
  action: keyof Omit<PlanFeatures, 'limits' | 'supportLevel' | 'paymentMethods'>
): boolean {
  return PLANS[tier].features[action];
}

/**
 * Récupère les limites d'un plan
 */
export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLANS[tier].features.limits;
}

/**
 * Vérifie si une valeur dépasse la limite d'un plan
 */
/**
 * Vérifie si une valeur dépasse la limite d'un plan.
 * Les limites >= 9999 sont considérées comme illimitées.
 */
export function exceedsLimit(
  tier: SubscriptionTier,
  limitType: keyof PlanLimits,
  currentValue: number
): boolean {
  const limit = PLANS[tier].features.limits[limitType];
  return limit < 9999 && currentValue >= limit;
}

/**
 * Récupère le Stripe Price ID pour un plan et un cycle
 */
/**
 * Récupère le Price ID Stripe correct selon les paramètres
 */
export function getStripePriceId(
  tier: SubscriptionTier,
  interval: BillingCycle,
  currency: Currency
): string {
  const plan = PLANS[tier];
  // Accès sécurisé : plan.pricing[currency][interval].priceId
  return plan.pricing[currency][interval].priceId;
}

/**
 * Valide qu'un tier est valide
 */
export function isValidTier(tier: string): tier is SubscriptionTier {
  return tier === 'starter' || tier === 'pro' || tier === 'enterprise';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PLANS;
