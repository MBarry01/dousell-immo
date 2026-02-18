/**
 * Team Subscription Logic
 * 
 * Helpers centralisés pour gérer les abonnements au niveau équipe
 * avec fallback vers profiles pour backward compatibility (3 mois)
 */

import { createClient } from '@/utils/supabase/server';
import { SubscriptionStatus, SubscriptionTier } from './plans-config';

export type { SubscriptionStatus, SubscriptionTier };

/**
 * Statuts legacy utilisés dans profiles.pro_status (migration en cours).
 * Mapper vers les statuts DB valides avant utilisation.
 */
type _LegacyStatus = 'none' | 'trial' | 'expired';

function normalizeLegacyStatus(status: string): SubscriptionStatus {
    switch (status) {
        case 'trial': return 'trialing';
        case 'expired': return 'past_due';
        case 'none': return 'canceled';
        default: return status as SubscriptionStatus;
    }
}

export interface FeatureCheckResult {
    allowed: boolean;
    reason?: 'limit_reached' | 'inactive_subscription' | 'trial_expired';
    message?: string;
    upgradeRequired?: boolean;
}

export interface TeamSubscription {
    status: SubscriptionStatus;
    tier: SubscriptionTier;
    trialEndsAt: Date | null;
    startedAt: Date | null;
    isActive: boolean;
    daysRemaining: number;
    billingCycle: 'monthly' | 'annual';
}

/**
 * Récupère le statut d'abonnement de l'équipe
 * 
 * Performance: Récupère directement depuis teams.subscription_*
 * Fallback: Si subscription_status null, regarde profiles.pro_status (legacy)
 * 
 * @param teamId - ID de l'équipe
 * @returns TeamSubscription avec toutes les infos d'abonnement
 */
export async function getTeamSubscriptionStatus(teamId: string): Promise<TeamSubscription> {
    const supabase = await createClient();

    // Récupérer depuis teams (nouvelle architecture)
    const { data: team } = await supabase
        .from('teams')
        .select('subscription_status, subscription_tier, subscription_trial_ends_at, subscription_started_at, billing_cycle')
        .eq('id', teamId)
        .single();

    if (team?.subscription_status) {
        // Nouvelle architecture: données dans teams
        const trialEndsAt = team.subscription_trial_ends_at ? new Date(team.subscription_trial_ends_at) : null;
        const startedAt = team.subscription_started_at ? new Date(team.subscription_started_at) : null;
        const daysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

        const isActive = team.subscription_status === 'active' ||
            (team.subscription_status === 'trialing' && daysRemaining > 0);

        return {
            status: team.subscription_status as SubscriptionStatus,
            tier: (team.subscription_tier || 'pro') as SubscriptionTier,
            trialEndsAt,
            startedAt,
            isActive,
            daysRemaining: Math.max(0, daysRemaining),
            billingCycle: (team.billing_cycle || 'monthly') as 'monthly' | 'annual',
        };
    }

    // Fallback vers profiles (backward compatibility - 3 mois)
    console.warn('⚠️ Team subscription not found, falling back to profiles.pro_status (legacy)');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return createDefaultSubscription();
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('pro_status, pro_trial_ends_at')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return createDefaultSubscription();
    }

    const trialEndsAt = profile.pro_trial_ends_at ? new Date(profile.pro_trial_ends_at) : null;
    const daysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    const status = normalizeLegacyStatus(profile.pro_status || 'none');
    const isActive = status === 'active' || (status === 'trialing' && daysRemaining > 0);

    return {
        status,
        tier: 'pro',
        trialEndsAt,
        startedAt: null,
        isActive,
        daysRemaining: Math.max(0, daysRemaining),
        billingCycle: 'monthly',
    };
}

/**
 * Vérifie si l'équipe a un abonnement actif
 * 
 * Utilisé comme guard pour les routes protégées
 * 
 * @param teamId - ID de l'équipe
 * @returns { success: boolean, error?: string }
 */
export async function requireActiveSubscription(teamId: string): Promise<{
    success: boolean;
    subscription?: TeamSubscription;
    error?: string;
}> {
    const subscription = await getTeamSubscriptionStatus(teamId);

    if (!subscription.isActive) {
        let errorMessage = 'Abonnement requis pour accéder à cette fonctionnalité.';

        if (subscription.status === 'past_due') {
            errorMessage = subscription.trialEndsAt && subscription.trialEndsAt < new Date()
                ? 'Votre essai a expiré. Activez votre abonnement pour continuer.'
                : 'Paiement en attente ou échoué. Veuillez régulariser votre situation.';
        } else if (subscription.status === 'canceled') {
            errorMessage = 'Abonnement annulé. Veuillez réactiver pour continuer.';
        } else if (subscription.status === 'unpaid') {
            errorMessage = 'Paiement échoué. Veuillez régulariser votre situation.';
        }

        return {
            success: false,
            subscription,
            error: errorMessage,
        };
    }

    return {
        success: true,
        subscription
    };
}

/**
 * Active l'abonnement trial pour une équipe
 * 
 * Utilisé lors de l'onboarding ou de la réactivation
 * 
 * @param teamId - ID de l'équipe
 * @param trialDays - Nombre de jours d'essai (défaut: 14)
 */
export async function activateTeamTrial(
    teamId: string,
    trialDays: number = 14
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Lire le compteur actuel pour savoir si c'est une réactivation
    const { data: currentTeam } = await supabase
        .from('teams')
        .select('subscription_status, trial_reactivation_count')
        .eq('id', teamId)
        .single();

    const isReactivation = currentTeam?.subscription_status === 'past_due' || currentTeam?.subscription_status === 'canceled';
    const newCount = isReactivation ? (currentTeam?.trial_reactivation_count ?? 0) + 1 : (currentTeam?.trial_reactivation_count ?? 0);

    const { error } = await supabase
        .from('teams')
        .update({
            subscription_status: 'trialing',
            subscription_trial_ends_at: trialEndsAt.toISOString(),
            subscription_started_at: new Date().toISOString(),
            subscription_tier: 'pro',
            trial_reactivation_count: newCount,
        })
        .eq('id', teamId);

    if (error) {
        console.error('❌ Error activating team trial:', error);
        return { success: false, error: 'Erreur lors de l\'activation de l\'essai' };
    }

    console.log(`✅ Team trial activated: ${teamId} (${trialDays} days, reactivation #${newCount})`);
    return { success: true };
}

/**
 * Passe l'abonnement en mode "active" (payé)
 * 
 * Appelé après confirmation de paiement
 * 
 * @param teamId - ID de l'équipe
 * @param tier - Tier choisi
 * @param billingCycle - Cycle de facturation
 */
export async function activateTeamSubscription(
    teamId: string,
    tier: SubscriptionTier = 'pro',
    billingCycle: 'monthly' | 'annual' = 'monthly'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('teams')
        .update({
            subscription_status: 'active',
            subscription_tier: tier,
            subscription_trial_ends_at: null, // Plus de limite de temps
            billing_cycle: billingCycle,
        })
        .eq('id', teamId);

    if (error) {
        console.error('❌ Error activating team subscription:', error);
        return { success: false, error: 'Erreur lors de l\'activation de l\'abonnement' };
    }

    console.log(`✅ Team subscription activated: ${teamId} (${tier}, ${billingCycle})`);
    return { success: true };
}

/**
 * Expire/Annule l'abonnement d'une équipe
 * 
 * Utilisé pour end of trial ou annulation
 * 
 * @param teamId - ID de l'équipe
 * @param reason - 'past_due' (fin essai/paiement échoué) ou 'canceled' (user action)
 */
export async function expireTeamSubscription(
    teamId: string,
    reason: 'past_due' | 'canceled' = 'past_due'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('teams')
        .update({
            subscription_status: reason,
        })
        .eq('id', teamId);

    if (error) {
        console.error('❌ Error expiring team subscription:', error);
        return { success: false, error: 'Erreur lors de la mise à jour du statut' };
    }

    console.log(`⚠️ Team subscription ${reason}: ${teamId}`);
    return { success: true };
}

/**
 * Vérifie si une équipe a accès à une fonctionnalité spécifique (Quotas)
 * 
 * @param teamId - ID de l'équipe
 * @param feature - La fonctionnalité à vérifier
 * @returns FeatureCheckResult
 */
export async function checkFeatureAccess(
    teamId: string,
    feature: 'add_property' | 'add_lease' | 'invite_member' | 'export_data' | 'manage_interventions' | 'view_advanced_reports'
): Promise<FeatureCheckResult> {
    const supabase = await createClient();
    const subscription = await getTeamSubscriptionStatus(teamId);

    // 1. Vérifier si l'abonnement est actif
    if (!subscription.isActive) {
        return {
            allowed: false,
            reason: 'inactive_subscription',
            message: "Votre abonnement n'est plus actif. Veuillez régulariser votre situation.",
            upgradeRequired: true
        };
    }

    const { getFeaturesForTier } = await import('./features');
    const features = getFeaturesForTier(subscription.tier);

    // 2. Vérifier les quotas spécifiques
    switch (feature) {
        case 'add_property': {
            const { count } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            if (count !== null && count >= features.limits.maxProperties) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: `Limite de biens atteinte (${features.limits.maxProperties}) pour le plan ${subscription.tier}.`,
                    upgradeRequired: true
                };
            }
            break;
        }

        case 'add_lease': {
            const { count } = await supabase
                .from('leases')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            if (count !== null && count >= features.limits.maxLeases) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: `Limite de baux atteinte (${features.limits.maxLeases}) pour le plan ${subscription.tier}.`,
                    upgradeRequired: true
                };
            }
            break;
        }

        case 'invite_member':
            if (!features.canInviteMembers) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: "L'invitation de membres n'est pas disponible dans votre plan actuel.",
                    upgradeRequired: true
                };
            }

            // Check member limit
            // Note: We need admin client to count members across all statuses if needed, 
            // but usually we count active members.
            const { count: memberCount } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('status', 'active'); // Only active members count towards limit

            // Add pending invitations to the count
            const { count: inviteCount } = await supabase
                .from('team_invitations')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('status', 'pending');

            const totalMembers = (memberCount || 0) + (inviteCount || 0);

            if (totalMembers >= features.limits.maxTeamMembers) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: `Limite de membres atteinte (${features.limits.maxTeamMembers}) pour le plan ${subscription.tier}.`,
                    upgradeRequired: true
                };
            }
            break;

        case 'export_data':
            if (!features.canExportData) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: "L'exportation de données n'est pas disponible dans votre plan actuel.",
                    upgradeRequired: true
                };
            }
            break;

        case 'manage_interventions':
            if (!features.canManageInterventions) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: "La gestion des incidents et interventions est réservée aux plans Pro et Enterprise.",
                    upgradeRequired: true
                };
            }
            break;

        case 'view_advanced_reports':
            if (!features.canUseAdvancedReports) {
                return {
                    allowed: false,
                    reason: 'limit_reached',
                    message: "Les analyses financières avancées sont réservées aux plans Pro et Enterprise.",
                    upgradeRequired: true
                };
            }
            break;
    }

    return { allowed: true };
}

/**
 * Fonction helper pour créer un abonnement par défaut
 */
function createDefaultSubscription(): TeamSubscription {
    return {
        status: 'canceled',
        tier: 'starter',
        trialEndsAt: null,
        startedAt: null,
        isActive: false,
        daysRemaining: 0,
        billingCycle: 'monthly',
    };
}
