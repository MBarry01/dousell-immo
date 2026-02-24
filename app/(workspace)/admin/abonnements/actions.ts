"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { requireAnyRole } from "@/lib/permissions";
import { PLANS, TRIAL_DURATION_DAYS } from "@/lib/subscription/plans-config";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/subscription/plans-config";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type SubscriptionTeam = {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus | null;
  subscription_tier: SubscriptionTier | null;
  subscription_trial_ends_at: string | null;
  subscription_started_at: string | null;
  billing_cycle: "monthly" | "annual" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

export type SubscriptionStats = {
  totalActive: number;
  totalTrialing: number;
  totalPastDue: number;
  totalCanceled: number;
  mrrXof: number;
  byTier: {
    starter: number;
    pro: number;
    enterprise: number;
  };
};

/**
 * Calcule le MRR (Monthly Recurring Revenue) en XOF pour un abonnement donné
 */
function computeMrrXof(tier: SubscriptionTier, cycle: "monthly" | "annual"): number {
  const plan = PLANS[tier];
  if (!plan) return 0;
  const amount = plan.pricing.xof[cycle].amount;
  return cycle === "annual" ? Math.round(amount / 12) : amount;
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  await requireAnyRole(["admin", "superadmin"]);
  const supabase = createAdminClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select("subscription_status, subscription_tier, billing_cycle");

  if (error || !teams) {
    console.error("[getSubscriptionStats] Error:", error);
    return {
      totalActive: 0,
      totalTrialing: 0,
      totalPastDue: 0,
      totalCanceled: 0,
      mrrXof: 0,
      byTier: { starter: 0, pro: 0, enterprise: 0 },
    };
  }

  // MRR = uniquement les abonnés actifs (pas les essais — pas encore facturés)
  let mrrXof = 0;
  for (const team of teams) {
    if (team.subscription_status !== "active") continue;
    if (!team.subscription_tier) continue;
    const tier = team.subscription_tier as SubscriptionTier;
    const cycle = (team.billing_cycle as "monthly" | "annual") ?? "monthly";
    mrrXof += computeMrrXof(tier, cycle);
  }

  const isActiveOrTrialing = (s: string | null) =>
    s === "active" || s === "trialing";

  return {
    totalActive: teams.filter((t) => t.subscription_status === "active").length,
    totalTrialing: teams.filter((t) => t.subscription_status === "trialing").length,
    totalPastDue: teams.filter((t) => t.subscription_status === "past_due").length,
    totalCanceled: teams.filter((t) => t.subscription_status === "canceled").length,
    mrrXof,
    byTier: {
      starter: teams.filter(
        (t) => t.subscription_tier === "starter" && isActiveOrTrialing(t.subscription_status)
      ).length,
      pro: teams.filter(
        (t) => t.subscription_tier === "pro" && isActiveOrTrialing(t.subscription_status)
      ).length,
      enterprise: teams.filter(
        (t) => t.subscription_tier === "enterprise" && isActiveOrTrialing(t.subscription_status)
      ).length,
    },
  };
}

export async function getSubscriptionTeams(): Promise<SubscriptionTeam[]> {
  await requireAnyRole(["admin", "superadmin"]);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, subscription_status, subscription_tier, subscription_trial_ends_at, subscription_started_at, billing_cycle, stripe_customer_id, stripe_subscription_id, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSubscriptionTeams] Error:", error);
    return [];
  }

  return data ?? [];
}

const OverrideSchema = z.object({
  teamId: z.string().uuid(),
  newStatus: z.enum(["trialing", "active", "past_due", "canceled", "unpaid", "incomplete"]),
  newTier: z.enum(["starter", "pro", "enterprise"]).optional(),
});

export async function overrideSubscriptionStatus(
  teamId: string,
  newStatus: SubscriptionStatus,
  newTier?: SubscriptionTier
): Promise<{ success: boolean; error?: string }> {
  await requireAnyRole(["admin", "superadmin"]);

  const parsed = OverrideSchema.safeParse({ teamId, newStatus, newTier });
  if (!parsed.success) {
    return { success: false, error: "Paramètres invalides" };
  }

  const supabase = createAdminClient();
  const { teamId: validTeamId, newStatus: validStatus, newTier: validTier } = parsed.data;

  const update: Record<string, unknown> = { subscription_status: validStatus };
  if (validTier) update.subscription_tier = validTier;

  // Side-effects dynamiques par statut
  switch (validStatus) {
    case "trialing": {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
      update.subscription_trial_ends_at = trialEnd.toISOString();
      update.trial_used = true;
      break;
    }
    case "active":
      // Activation manuelle : effacer la fin d'essai, dater le début
      update.subscription_trial_ends_at = null;
      update.subscription_started_at = new Date().toISOString();
      break;
    case "canceled":
    case "past_due":
    case "unpaid":
    case "incomplete":
      // Ces statuts ne sont pas en essai : effacer la date de fin d'essai
      update.subscription_trial_ends_at = null;
      break;
  }

  const { error } = await supabase.from("teams").update(update).eq("id", validTeamId);

  if (error) {
    console.error("[overrideSubscriptionStatus] Error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/abonnements");
  return { success: true };
}
