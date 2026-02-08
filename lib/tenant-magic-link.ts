/**
 * Tenant Magic Link Service
 *
 * Handles token generation and validation for tenant access to /locataire
 * Tenants do NOT have auth.users accounts - they access via Magic Link only.
 *
 * Security measures:
 * - Tokens are hashed (SHA-256) before storing in DB
 * - Raw tokens are sent to tenants via email (never stored)
 * - Cookie stores raw token, validation hashes it for comparison
 * - Tokens expire after 7 days
 * - All access attempts are logged to tenant_access_logs table
 *
 * Per WORKFLOW_PROPOSAL.md section 4.3, 5.1.1, and REMAINING_TASKS.md 3.5.2
 */

import { createAdminClient } from "@/utils/supabase/admin";
import { randomBytes, createHash } from "crypto";
import { headers } from "next/headers";
import { trackServerEvent, EVENTS } from "@/lib/analytics";

// Access log action types
type TenantAccessAction =
  | "token_generated"
  | "token_validated"
  | "token_validation_failed"
  | "identity_verified"
  | "identity_verification_failed"
  | "token_revoked"
  | "session_created"
  | "session_expired";

// Token expiration: 7 days
const TOKEN_EXPIRATION_DAYS = 7;
// Session cookie expiration: 24 hours
const SESSION_EXPIRATION_HOURS = 24;

/**
 * Hash a token using SHA-256
 * Used to store and compare tokens securely
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Get client IP and user agent from request headers
 */
async function getClientInfo(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Log tenant access event to database
 *
 * @param action - Type of access action
 * @param leaseId - Associated lease ID (optional)
 * @param failureReason - Reason for failure (if applicable)
 */
async function logTenantAccess(
  action: TenantAccessAction,
  leaseId?: string | null,
  failureReason?: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { ipAddress, userAgent } = await getClientInfo();

    await supabase.from("tenant_access_logs").insert({
      lease_id: leaseId || null,
      action,
      ip_address: ipAddress,
      user_agent: userAgent?.slice(0, 500), // Truncate long user agents
      failure_reason: failureReason || null,
    });
  } catch (error) {
    // Logging should not break the main flow
    console.error("[TENANT_ACCESS_LOG] Failed to log:", error);
  }
}

export interface TenantSession {
  lease_id: string;
  property_id: string;
  tenant_name: string;
  tenant_email: string | null;
  property_title: string;
  property_address: string | null;
  expires_at: Date;
  verified: boolean;
}

/**
 * Generate a new tenant access token for a lease
 *
 * Security: The raw token is returned to be sent via email.
 * Only the SHA-256 hash is stored in the database.
 *
 * @param leaseId - The lease ID to generate token for
 * @returns The raw token (hex, 64 chars) - to be sent to tenant
 */
export async function generateTenantAccessToken(leaseId: string): Promise<string> {
  const supabase = createAdminClient();

  // Generate secure random token
  const rawToken = randomBytes(32).toString("hex");

  // Hash the token for secure storage
  const hashedToken = hashToken(rawToken);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRATION_DAYS);

  // Update lease with HASHED token (never store raw)
  const { error } = await supabase
    .from("leases")
    .update({
      tenant_access_token: hashedToken,
      tenant_token_expires_at: expiresAt.toISOString(),
      tenant_token_verified: false,
    })
    .eq("id", leaseId);

  if (error) {
    console.error("Error generating tenant token:", error);
    throw new Error("Impossible de générer le lien d'accès.");
  }

  // Log token generation to audit table
  await logTenantAccess("token_generated", leaseId);
  console.log(`[TENANT_ACCESS] Token generated for lease ${leaseId}`);

  // Track analytics
  trackServerEvent(EVENTS.TENANT_MAGIC_LINK_SENT, {
    lease_id: leaseId,
  });

  // Return RAW token to be sent via email
  return rawToken;
}

/**
 * Validate a tenant access token
 *
 * Security: The input token is hashed before comparison.
 * This ensures the raw token is never stored or logged server-side.
 *
 * Checks:
 * 1. Token hash exists in leases table
 * 2. Token is not expired
 * 3. Lease is active
 *
 * @param token - The raw token to validate (from URL or cookie)
 * @returns TenantSession if valid, null otherwise
 */
export async function validateTenantToken(token: string): Promise<TenantSession | null> {
  const supabase = createAdminClient();

  // Hash the input token for comparison
  const hashedToken = hashToken(token);

  const { data: lease, error } = await supabase
    .from("leases")
    .select(`
      id,
      property_id,
      status,
      tenant_name,
      tenant_email,
      tenant_token_expires_at,
      tenant_token_verified,
      property_address,
      property:properties (
        title,
        location
      )
    `)
    .eq("tenant_access_token", hashedToken)
    .eq("status", "active")
    .gt("tenant_token_expires_at", new Date().toISOString())
    .single();

  if (error || !lease) {
    // Determine failure reason
    let failureReason = "Token not found";
    if (error?.code === "PGRST116") {
      // Check if token exists but is expired or inactive
      const { data: expiredLease } = await supabase
        .from("leases")
        .select("id, status, tenant_token_expires_at")
        .eq("tenant_access_token", hashedToken)
        .single();

      if (expiredLease) {
        if (expiredLease.status !== "active") {
          failureReason = `Lease status: ${expiredLease.status}`;
        } else if (new Date(expiredLease.tenant_token_expires_at) < new Date()) {
          failureReason = "Token expired";
        }
      }
    }

    // Log failed validation attempt to database
    await logTenantAccess("token_validation_failed", null, failureReason);
    console.log(`[TENANT_ACCESS] Token validation failed: ${failureReason}`);
    return null;
  }

  // Log successful validation to database
  await logTenantAccess("token_validated", lease.id);
  console.log(`[TENANT_ACCESS] Token validated for lease ${lease.id}`);

  return {
    lease_id: lease.id,
    property_id: lease.property_id,
    tenant_name: lease.tenant_name,
    tenant_email: lease.tenant_email,
    property_title: (lease.property as unknown as { title?: string } | null)?.title || "Bien immobilier",
    property_address: lease.property_address || ((lease.property as unknown as { location?: { city?: string } } | null)?.location?.city) || null,
    expires_at: new Date(lease.tenant_token_expires_at),
    verified: lease.tenant_token_verified || false,
  };
}

/**
 * Mark a tenant token as verified (first access validated)
 *
 * @param leaseId - The lease ID
 */
export async function markTenantTokenVerified(leaseId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("leases")
    .update({
      tenant_token_verified: true,
      tenant_last_access_at: new Date().toISOString(),
    })
    .eq("id", leaseId);

  // Log identity verification success
  await logTenantAccess("identity_verified", leaseId);

  // Track tenant activation
  trackServerEvent(EVENTS.TENANT_ACTIVATED, {
    lease_id: leaseId,
    verification_required: true,
  });
}

/**
 * Update tenant last access timestamp
 *
 * @param leaseId - The lease ID
 */
export async function updateTenantLastAccess(leaseId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("leases")
    .update({
      tenant_last_access_at: new Date().toISOString(),
    })
    .eq("id", leaseId);
}

/**
 * Validate tenant identity by last name (fuzzy match)
 *
 * Used on first access to verify the tenant is who they say they are.
 *
 * @param leaseId - The lease ID
 * @param lastName - The last name provided by the user
 * @returns true if match, false otherwise
 */
export async function validateTenantIdentity(leaseId: string, lastName: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: lease } = await supabase
    .from("leases")
    .select("tenant_name")
    .eq("id", leaseId)
    .single();

  if (!lease) {
    await logTenantAccess("identity_verification_failed", leaseId, "Lease not found");
    return false;
  }

  // Normalize both strings for comparison
  const normalizedInput = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const tenantName = lease.tenant_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Check if the provided last name is part of the full name
  const nameParts = tenantName.split(/\s+/);

  // Match against any part of the name (first or last)
  const isMatch = nameParts.some((part: string) => part === normalizedInput);

  if (!isMatch) {
    await logTenantAccess("identity_verification_failed", leaseId, "Name mismatch");
  }

  return isMatch;
}

/**
 * Log session creation (for audit trail)
 *
 * @param leaseId - The lease ID
 */
export async function logTenantSessionCreated(leaseId: string): Promise<void> {
  await logTenantAccess("session_created", leaseId);
}

/**
 * Revoke a tenant access token
 *
 * Used when:
 * - Owner wants to revoke access
 * - Sending a new invitation (revokes old token)
 *
 * @param leaseId - The lease ID
 */
export async function revokeTenantToken(leaseId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("leases")
    .update({
      tenant_access_token: null,
      tenant_token_expires_at: null,
      tenant_token_verified: false,
    })
    .eq("id", leaseId);

  // Log token revocation
  await logTenantAccess("token_revoked", leaseId);
}

/**
 * Generate the magic link URL for a tenant
 *
 * @param token - The access token
 * @returns Full URL to /locataire with token
 */
export function getTenantMagicLinkUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/locataire?token=${token}`;
}

/**
 * Cookie configuration for tenant session
 *
 * Note: path is "/" to allow API routes (/api/stripe/rent-checkout, etc.)
 * to access the tenant session. The session is still validated against
 * the lease and can only be created from valid magic links.
 */
export const TENANT_SESSION_COOKIE_OPTIONS = {
  name: "tenant_session",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // "lax" allows cookies on same-site navigations
  maxAge: SESSION_EXPIRATION_HOURS * 60 * 60, // in seconds
  path: "/", // Root path to include API routes
};

/**
 * Get tenant session from cookie (server-side)
 *
 * Use this in Server Actions and API routes to get the current tenant session.
 * Returns null if no valid session exists.
 *
 * @returns TenantSession if valid, null otherwise
 */
export async function getTenantSessionFromCookie(): Promise<TenantSession | null> {
  // Dynamic import to avoid issues with client components
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("tenant_session")?.value;

  if (!token) {
    return null;
  }

  return validateTenantToken(token);
}

/**
 * Get tenant lease data for dashboard
 *
 * Fetches full lease data with property and payments for tenant dashboard.
 * Uses the tenant session from cookie.
 *
 * @returns Lease data with property and payments, or null if not found
 */
export async function getTenantLeaseData() {
  const session = await getTenantSessionFromCookie();

  if (!session) {
    return null;
  }

  // Use admin client to bypass RLS - tenant has no Supabase auth session
  const adminClient = createAdminClient();

  // Fetch lease + property
  const { data: lease, error } = await adminClient
    .from("leases")
    .select(`
      id,
      property_id,
      owner_id,
      tenant_name,
      tenant_email,
      tenant_phone,
      monthly_amount,
      start_date,
      end_date,
      status,
      property_address,
      property:properties (
        id,
        title,
        location,
        details,
        images
      )
    `)
    .eq("id", session.lease_id)
    .single();

  if (error || !lease) {
    console.error("Error fetching tenant lease data:", error);
    return null;
  }

  // Fetch payments separately with admin client to ensure fresh data
  const { data: payments, error: paymentsError } = await adminClient
    .from("rental_transactions")
    .select("id, amount_due, paid_at, payment_method, status, period_month, period_year, created_at")
    .eq("lease_id", session.lease_id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (paymentsError) {
    console.error("Error fetching tenant payments:", paymentsError);
  }

  return {
    lease: {
      ...lease,
      payments: payments || [],
    },
    tenantName: session.tenant_name,
    tenantEmail: session.tenant_email,
  };
}

/**
 * Get the number of failed verification attempts for a specific lease
 * 
 * Helper for security throttling.
 * Queries tenant_access_logs for recent 'identity_verification_failed' events.
 * 
 * @param leaseId - The lease ID to check
 * @returns Number of failed attempts
 */
export async function getTenantFailedAttempts(leaseId: string): Promise<number> {
  const supabase = createAdminClient();

  // Find when the latest token was generated for this lease
  // Only count failures AFTER the most recent token generation
  const { data: lastTokenGen } = await supabase
    .from("tenant_access_logs")
    .select("created_at")
    .eq("lease_id", leaseId)
    .eq("action", "token_generated")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Count failed attempts since the last token generation
  let query = supabase
    .from("tenant_access_logs")
    .select("id", { count: "exact", head: true })
    .eq("lease_id", leaseId)
    .eq("action", "identity_verification_failed");

  if (lastTokenGen?.created_at) {
    query = query.gt("created_at", lastTokenGen.created_at);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error counting failed attempts:", error);
    return 0;
  }

  return count || 0;
}
