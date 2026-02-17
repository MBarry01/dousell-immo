/**
 * Subscription utilities - Re-exports
 */

export {
    getTeamSubscriptionStatus,
    requireActiveSubscription,
    activateTeamTrial,
    activateTeamSubscription,
    expireTeamSubscription,
    type TeamSubscription,
    type FeatureCheckResult,
} from './team-subscription';

// Source unique de vérité pour les types
export {
    type SubscriptionStatus,
    type SubscriptionTier,
} from './plans-config';
