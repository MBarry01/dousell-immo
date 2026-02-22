// lib/activation/get-activation-stage.ts
import { createClient } from "@/utils/supabase/server";

export type ActivationStage = 1 | 2 | 3 | 4;

export interface ActivationData {
  stage: ActivationStage;
  completedAt: Date | null;
  firstPropertyId: string | null; // Used for stage 2+3 CTA link
}

/**
 * Calculates the current activation stage for a team.
 * Stage 1: No properties → add a property
 * Stage 2: ≥1 property, no tenants → add tenant+lease via AddTenantButton
 * Stage 3: ≥1 tenant, no active leases → (same action as stage 2)
 * Stage 4: ≥1 active lease → complete
 *
 * Uses COUNT(*) with indexed team_id for minimal DB load.
 * Returns early if activation_completed_at is already set.
 */
export async function getActivationData(teamId: string): Promise<ActivationData> {
  const supabase = await createClient();

  // First: check if already completed (cheap single lookup)
  const { data: team } = await supabase
    .from("teams")
    .select("activation_completed_at")
    .eq("id", teamId)
    .single();

  if (team?.activation_completed_at) {
    return {
      stage: 4,
      completedAt: new Date(team.activation_completed_at),
      firstPropertyId: null,
    };
  }

  // Count properties — fetch one to get firstPropertyId
  const { data: properties, count: propertyCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: false })
    .eq("team_id", teamId)
    .limit(1);

  if (!propertyCount || propertyCount === 0) {
    return { stage: 1, completedAt: null, firstPropertyId: null };
  }

  const firstPropertyId = properties?.[0]?.id ?? null;

  // Count tenants
  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (!tenantCount || tenantCount === 0) {
    return { stage: 2, completedAt: null, firstPropertyId };
  }

  // Count active leases
  const { count: leaseCount } = await supabase
    .from("leases")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "active");

  if (!leaseCount || leaseCount === 0) {
    return { stage: 3, completedAt: null, firstPropertyId };
  }

  return { stage: 4, completedAt: null, firstPropertyId };
}
