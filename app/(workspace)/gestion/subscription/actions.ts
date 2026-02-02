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
export async function reactivateSubscription() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Vous devez être connecté." };
  }

  // ✅ NOUVELLE ARCHITECTURE: Réactivation au niveau équipe
  const { getUserTeamContext } = await import("@/lib/team-permissions.server");
  const { activateTeamTrial } = await import("@/lib/subscription");

  const teamContext = await getUserTeamContext();

  if (teamContext) {
    // Vérifier que l'équipe peut être réactivée
    const { data: team } = await supabase
      .from("teams")
      .select("subscription_status")
      .eq("id", teamContext.team_id)
      .single();

    if (!team) {
      return { error: "Équipe introuvable." };
    }

    if (team.subscription_status !== "expired" && team.subscription_status !== "none" && team.subscription_status !== "canceled") {
      return { error: "Votre abonnement est déjà actif." };
    }

    // Réactiver l'abonnement de l'équipe (14 jours d'essai)
    const result = await activateTeamTrial(teamContext.team_id, 14);

    if (!result.success) {
      return { error: result.error || "Erreur lors de la réactivation." };
    }

    console.log(`✅ Team subscription reactivated: ${teamContext.team_id}`);
    return { success: true };
  }

  // ⚠️ FALLBACK: Utilisateur sans équipe (legacy profiles)
  console.warn("⚠️ Reactivation fallback: user has no team, using profiles.pro_status");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_status")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profil introuvable." };
  }

  if (profile.pro_status !== "expired" && profile.pro_status !== "none") {
    return { error: "Votre abonnement est déjà actif." };
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
    .eq("id", user.id);

  if (updateError) {
    console.error("Reactivation error (legacy):", updateError);
    return { error: "Erreur lors de la réactivation." };
  }

  return { success: true };
}

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
