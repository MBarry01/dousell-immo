import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateTenantToken } from "@/lib/tenant-magic-link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tenant/unread-counts
 *
 * Returns unread message count and pending maintenance count for the tenant.
 * Uses tenant session cookie (no auth.users required).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tenantSessionCookie = cookieStore.get("tenant_session")?.value;

    if (!tenantSessionCookie) {
      return NextResponse.json({ unreadMessages: 0, pendingMaintenance: 0 });
    }

    const session = await validateTenantToken(tenantSessionCookie);
    if (!session) {
      return NextResponse.json({ unreadMessages: 0, pendingMaintenance: 0 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch unread messages (from owner, not read by tenant)
    const { count: unreadMessages } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("lease_id", session.lease_id)
      .eq("sender_type", "owner")
      .is("read_at", null);

    // Fetch all active maintenance requests (everything except terminal states)
    const { count: pendingMaintenance } = await supabaseAdmin
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .eq("lease_id", session.lease_id)
      .not("status", "in", '("completed","rejected","cancelled")');

    return NextResponse.json({
      unreadMessages: unreadMessages || 0,
      pendingMaintenance: pendingMaintenance || 0,
    });
  } catch (error) {
    console.error("Error fetching tenant unread counts:", error);
    return NextResponse.json({ unreadMessages: 0, pendingMaintenance: 0 });
  }
}
