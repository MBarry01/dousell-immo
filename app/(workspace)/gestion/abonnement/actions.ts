"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Reactivate subscription for expired users
 *
 * Actions performed:
 * 1. Set pro_status back to 'trial'
 * 2. Set new pro_trial_ends_at (14 days from now)
 *
 * Per WORKFLOW_PROPOSAL.md section 11.1
 */
import { z } from "zod";
import { safeAction } from "@/lib/safe-action";

/**
 * Reactivate subscription for expired users
 *
 * Actions performed:
 * 1. Set pro_status back to 'trial'
 * 2. Set new pro_trial_ends_at (14 days from now)
 *
 * Per WORKFLOW_PROPOSAL.md section 11.1
 */
export const reactivateSubscription = safeAction(
  "reactivateSubscription",
  z.void(), // Accepts undefined/void
  async (_, { userId }) => {
    if (!userId) {
      throw new Error("Vous devez être connecté.");
    }

    const supabase = await createClient();

    // ✅ NOUVELLE ARCHITECTURE: Réactivation au niveau équipe
    const { getUserTeamContext } = await import("@/lib/team-permissions.server");
    const { activateTeamTrial } = await import("@/lib/subscription");

    const teamContext = await getUserTeamContext();

    if (teamContext) {
      // Vérifier que l'équipe peut être réactivée
      const { data: team } = await supabase
        .from("teams")
        .select("subscription_status, trial_reactivation_count, subscription_trial_ends_at")
        .eq("id", teamContext.team_id)
        .single();

      if (!team) {
        throw new Error("Équipe introuvable.");
      }

      // Normaliser le statut (le cron peut ne pas avoir encore tourné)
      let effectiveStatus = team.subscription_status;
      if (effectiveStatus === "trialing" && team.subscription_trial_ends_at) {
        const trialEnd = new Date(team.subscription_trial_ends_at);
        if (trialEnd < new Date()) {
          effectiveStatus = "past_due";
        }
      }

      if (effectiveStatus !== "past_due" && effectiveStatus !== "canceled") {
        throw new Error("Votre abonnement est déjà actif.");
      }

      // Bloquer si la réactivation d'essai a déjà été utilisée
      const MAX_TRIAL_REACTIVATIONS = 1;
      if ((team.trial_reactivation_count ?? 0) >= MAX_TRIAL_REACTIVATIONS) {
        throw new Error(
          "Vous avez déjà utilisé votre réactivation d'essai gratuit. Veuillez souscrire à un abonnement pour continuer."
        );
      }

      // Réactiver l'abonnement de l'équipe (14 jours d'essai)
      const result = await activateTeamTrial(teamContext.team_id, 14);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la réactivation.");
      }

      return { success: true };
    }

    // ⚠️ FALLBACK: Utilisateur sans équipe (legacy profiles)
    console.warn("⚠️ Reactivation fallback: user has no team, using profiles.pro_status");

    const { data: profile } = await supabase
      .from("profiles")
      .select("pro_status")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("Profil introuvable.");
    }

    if (profile.pro_status !== "expired" && profile.pro_status !== "none") {
      throw new Error("Votre abonnement est déjà actif.");
    }

    // Calculate new trial end date (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Reactivate (legacy)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pro_status: "trial",
        pro_trial_ends_at: trialEndsAt.toISOString(),
        gestion_locative_enabled: true,
        gestion_locative_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Reactivation error (legacy):", updateError);
      throw new Error("Erreur lors de la réactivation.");
    }

    return { success: true };
  }
);

/**
 * Get subscription status for display
 */
export async function getSubscriptionStatus() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  // ✅ NOUVELLE ARCHITECTURE: Récupérer depuis équipe
  const { getUserTeamContext } = await import("@/lib/team-permissions.server");
  const { getTeamSubscriptionStatus } = await import("@/lib/subscription");

  const teamContext = await getUserTeamContext();

  if (teamContext) {
    const subscription = await getTeamSubscriptionStatus(teamContext.team_id);

    return {
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
      tier: subscription.tier,
      isActive: subscription.isActive,
      daysRemaining: subscription.daysRemaining,
    };
  }

  // ⚠️ FALLBACK: profiles (legacy)
  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_status, pro_trial_ends_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profil introuvable" };
  }

  return {
    status: profile.pro_status,
    trialEndsAt: profile.pro_trial_ends_at,
    tier: 'pro',
    isActive: ['trial', 'active'].includes(profile.pro_status || ''),
  };
}
