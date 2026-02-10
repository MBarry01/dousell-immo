import Stripe from 'stripe';
import { getStripePriceId, type SubscriptionTier, type BillingCycle } from './plans-config';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined, Stripe features will not work.');
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

/**
 * Récupère le Stripe Price ID pour un plan donné
 *
 * @param tier - Le tier du plan (starter, pro, enterprise)
 * @param cycle - Le cycle de facturation (monthly ou annual). Default: 'monthly'
 * @returns Stripe Price ID ou placeholder si non configuré
 *
 * @deprecated Utilisez getStripePriceId depuis plans-config.ts directement
 */
export function getStripePriceIdForPlan(
    tier: SubscriptionTier,
    cycle: BillingCycle = 'monthly'
): string {
    const priceId = getStripePriceId(tier, cycle, 'xof');
    return priceId || `price_${tier}_${cycle}_placeholder`;
}

/**
 * Configuration des plans Stripe (legacy format pour compatibilité)
 *
 * @deprecated Utilisez getStripePriceId() depuis plans-config.ts
 * Note: Par défaut, renvoie le prix MENSUEL. Pour annuel, utiliser getStripePriceIdForPlan()
 */
export const STRIPE_PLANS = {
    starter: {
        priceId: getStripePriceIdForPlan('starter', 'monthly'),
        name: 'Starter',
    },
    pro: {
        priceId: getStripePriceIdForPlan('pro', 'monthly'),
        name: 'Professional',
    },
    enterprise: {
        priceId: getStripePriceIdForPlan('enterprise', 'monthly'),
        name: 'Enterprise',
    },
} as const;
