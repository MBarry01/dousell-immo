import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateTenantToken } from "@/lib/tenant-magic-link";

/**
 * GET /api/tenant/session
 *
 * Returns the current tenant session info based on the session cookie.
 * Used by the tenant portal UI to display tenant name, property info, etc.
 *
 * This endpoint does NOT require auth.users authentication.
 * It validates the tenant session cookie instead.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tenantSessionCookie = cookieStore.get("tenant_session")?.value;

    if (!tenantSessionCookie) {
      return NextResponse.json(
        { error: "No tenant session" },
        { status: 401 }
      );
    }

    // Validate the token from cookie
    const session = await validateTenantToken(tenantSessionCookie);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Return tenant info (no sensitive data)
    return NextResponse.json({
      lease_id: session.lease_id,
      tenant_name: session.tenant_name,
      tenant_email: session.tenant_email,
      property_title: session.property_title,
      property_address: session.property_address,
      verified: session.verified,
    });
  } catch (error) {
    console.error("Error getting tenant session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
