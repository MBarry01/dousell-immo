"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserTeamContext } from "@/lib/team-context";
import { type UserTeamContext } from "@/types/team";
import { revalidatePath } from "next/cache";

/**
 * Get unread message count and pending maintenance count for the owner/team.
 * Used in workspace navigation badges.
 */
export async function getOwnerUnreadCounts() {
  try {
    const context = await getUserTeamContext();
    if (!context || !context.teamId || !context.user) return { unreadMessages: 0, pendingMaintenance: 0 };
    const { teamId, user } = context as Required<Pick<UserTeamContext, 'teamId' | 'user'>>;

    const supabase = await createClient();

    // Get all lease IDs for this team
    const { data: leases } = await supabase
      .from("leases")
      .select("id")
      .eq("team_id", teamId);

    if (!leases || leases.length === 0) {
      return { unreadMessages: 0, pendingMaintenance: 0 };
    }

    const leaseIds = leases.map((l) => l.id);

    // Unread messages from tenants (sender_type = 'tenant', not read)
    const { count: unreadMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("lease_id", leaseIds)
      .eq("sender_type", "tenant")
      .is("read_at", null);

    // Active maintenance requests not yet viewed by owner
    const { count: pendingMaintenance } = await supabase
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .in("lease_id", leaseIds)
      .not("status", "in", '("completed","rejected","cancelled")')
      .is("owner_viewed_at", null);

    return {
      unreadMessages: unreadMessages || 0,
      pendingMaintenance: pendingMaintenance || 0,
    };
  } catch (error) {
    console.error("Error fetching owner unread counts:", error);
    return { unreadMessages: 0, pendingMaintenance: 0 };
  }
}

/**
 * Mark all active maintenance requests as viewed by the owner.
 * Called when the interventions page is opened.
 */
export async function markMaintenanceAsViewed() {
  try {
    const context = await getUserTeamContext();
    if (!context || !context.teamId || !context.user) return;
    const { teamId, user } = context as Required<Pick<UserTeamContext, 'teamId' | 'user'>>;

    const supabase = await createClient();

    const { data: leases } = await supabase
      .from("leases")
      .select("id")
      .eq("team_id", teamId);

    if (!leases || leases.length === 0) return;

    const leaseIds = leases.map((l) => l.id);

    // Mark all unviewed requests as viewed (active ones clear the badge)
    await supabase
      .from("maintenance_requests")
      .update({ owner_viewed_at: new Date().toISOString() })
      .in("lease_id", leaseIds)
      .is("owner_viewed_at", null);

    revalidatePath("/gestion/interventions");
  } catch (error) {
    console.error("Error marking maintenance as viewed:", error);
  }
}
