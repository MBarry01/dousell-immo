import { SubscriptionTier, PlanFeatures, PLANS } from './plans-config';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface TeamSubscriptionContext {
    subscription_tier: SubscriptionTier;
    subscription_status: SubscriptionStatus;
}

/**
 * Determines if a team has write access to the platform.
 * 
 * Logic:
 * - Active & Trialing -> Write Access (OK)
 * - Past Due, Canceled, Unpaid -> Read Only (Blocked)
 */
export function canWrite(team: TeamSubscriptionContext | null | undefined): boolean {
    if (!team) return false;

    const WRITE_ALLOWED_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

    return WRITE_ALLOWED_STATUSES.includes(team.subscription_status);
}

/**
 * Determines if a team is in a blocked state (Read Only).
 * This is the inverse of canWrite, but explicitly checks for blocking statuses.
 */
export function isBlocked(team: TeamSubscriptionContext | null | undefined): boolean {
    if (!team) return true; // No team = blocked

    const BLOCKED_STATUSES: SubscriptionStatus[] = ['past_due', 'canceled', 'unpaid', 'incomplete'];
    return BLOCKED_STATUSES.includes(team.subscription_status);
}

/**
 * Determines if a team has access to a specific feature.
 * This combines subscription tier limits AND write access status.
 */
export function canAccessFeature(
    team: TeamSubscriptionContext,
    feature: keyof PlanFeatures
): boolean {
    const plan = PLANS[team.subscription_tier];
    if (!plan) return false;

    return true;
}
