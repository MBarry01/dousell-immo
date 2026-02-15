"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserTeamContext } from "@/lib/team-context";

/**
 * Get unread message count and pending maintenance count for the owner/team.
 * Used in workspace navigation badges.
 */
export async function getOwnerUnreadCounts() {
  try {
    const { teamId, user } = await getUserTeamContext();
    if (!user) return { unreadMessages: 0, pendingMaintenance: 0 };

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

    // Pending maintenance requests needing owner action
    const { count: pendingMaintenance } = await supabase
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .in("lease_id", leaseIds)
      .in("status", ["submitted", "open", "quote_received"]);

    return {
      unreadMessages: unreadMessages || 0,
      pendingMaintenance: pendingMaintenance || 0,
    };
  } catch (error) {
    console.error("Error fetching owner unread counts:", error);
    return { unreadMessages: 0, pendingMaintenance: 0 };
  }
}
