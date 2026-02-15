/**
 * Tenant Magic Link Service
 *
 * Handles token generation and validation for tenant access to /locataire
 * Tenants do NOT have auth.users accounts - they access via Magic Link only.
 *
 * Security measures:
 * - Tokens are hashed (SHA-256) before storing in DB
 * - Raw tokens are sent to tenants via email (never stored)
 * - Magic link tokens are single-use (invalidated after first login)
 * - Session uses a separate hash (tenant_session_hash) from the magic link token
 * - Cookie is httpOnly, secure, sameSite: strict
 * - Tokens expire after 24 hours
 * - Session rotates every 4 hours
 * - All access attempts are logged to tenant_access_logs table
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

// Magic link token expiration: 24 hours
const TOKEN_EXPIRATION_HOURS = 24;
// Session cookie expiration: 24 hours
const SESSION_EXPIRATION_HOURS = 24;
// Session rotation interval: 4 hours
const SESSION_ROTATION_HOURS = 4;

/**
 * Hash a token using SHA-256
 * Used to store and compare tokens securely
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a secure random token (64 hex chars)
 */
function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
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
      user_agent: userAgent?.slice(0, 500),
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
 * Security:
 * - Revokes any previous token first (audit trail)
 * - The raw token is returned to be sent via email
 * - Only the SHA-256 hash is stored in the database
 * - Token expires in 24 hours (single-use after first login)
 *
 * @param leaseId - The lease ID to generate token for
 * @returns The raw token (hex, 64 chars) - to be sent to tenant
 */
export async function generateTenantAccessToken(leaseId: string): Promise<string> {
  const supabase = createAdminClient();

  // Revoke any existing token first for audit trail
  await revokeTenantToken(leaseId);

  // Generate secure random token
  const rawToken = generateSecureToken();

  // Hash the token for secure storage
  const hashedToken = hashToken(rawToken);

  // Calculate expiration (24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRATION_HOURS);

  // Update lease with HASHED token (never store raw)
  const { error } = await supabase
    .from("leases")
    .update({
      tenant_access_token: hashedToken,
      tenant_token_expires_at: expiresAt.toISOString(),
      tenant_token_verified: false,
      tenant_session_hash: null, // Clear any previous session
    })
    .eq("id", leaseId);

  if (error) {
    console.error("Error generating tenant token:", error);
    throw new Error("Impossible de générer le lien d'accès.");
  }

  // Log token generation to audit table
  await logTenantAccess("token_generated", leaseId);

  // Track analytics
  trackServerEvent(EVENTS.TENANT_MAGIC_LINK_SENT, {
    lease_id: leaseId,
  });

  // Return RAW token to be sent via email
  return rawToken;
}

/**
 * Validate a tenant magic link token (from URL)
 *
 * Security: The input token is hashed before comparison.
 * This validates the one-time magic link token, NOT the session.
 *
 * Checks:
 * 1. Token hash exists in leases table
 * 2. Token is not expired
 * 3. Lease is active
 *
 * @param token - The raw token to validate (from URL)
 * @returns TenantSession if valid, null otherwise
 */
export async function validateTenantToken(token: string): Promise<TenantSession | null> {
  const supabase = createAdminClient();

  // Hash the input token for comparison
  const hashedToken = hashToken(token);

  // First try to validate against the magic link token (tenant_access_token)
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

    await logTenantAccess("token_validation_failed", null, failureReason);
    return null;
  }

  // Log successful validation
  await logTenantAccess("token_validated", lease.id);

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
 * Validate a tenant session token (from cookie)
 *
 * This validates the session hash stored in tenant_session_hash,
 * separate from the one-time magic link token.
 *
 * @param sessionToken - The raw session token from cookie
 * @returns TenantSession if valid, null otherwise
 */
export async function validateTenantSession(sessionToken: string): Promise<TenantSession | null> {
  const supabase = createAdminClient();

  const hashedSession = hashToken(sessionToken);

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
    .eq("tenant_session_hash", hashedSession)
    .eq("status", "active")
    .single();

  if (error || !lease) {
    return null;
  }

  return {
    lease_id: lease.id,
    property_id: lease.property_id,
    tenant_name: lease.tenant_name,
    tenant_email: lease.tenant_email,
    property_title: (lease.property as unknown as { title?: string } | null)?.title || "Bien immobilier",
    property_address: lease.property_address || ((lease.property as unknown as { location?: { city?: string } } | null)?.location?.city) || null,
    expires_at: lease.tenant_token_expires_at ? new Date(lease.tenant_token_expires_at) : new Date(),
    verified: lease.tenant_token_verified || false,
  };
}

/**
 * Create a tenant session after successful magic link validation
 *
 * Generates a separate session token, stores its hash in tenant_session_hash,
 * and invalidates the magic link token (single-use).
 *
 * @param leaseId - The lease ID
 * @returns The raw session token to store in cookie
 */
export async function createTenantSession(leaseId: string): Promise<string> {
  const supabase = createAdminClient();

  // Generate a new session token (separate from magic link token)
  const rawSessionToken = generateSecureToken();
  const hashedSession = hashToken(rawSessionToken);

  // Invalidate magic link token (single-use) and set session hash
  await supabase
    .from("leases")
    .update({
      tenant_access_token: null, // Magic link is now single-use
      tenant_session_hash: hashedSession,
      tenant_last_access_at: new Date().toISOString(),
    })
    .eq("id", leaseId);

  // Log session creation
  await logTenantAccess("session_created", leaseId);

  return rawSessionToken;
}

/**
 * Rotate tenant session token
 *
 * Generates a new session token and updates the hash in DB.
 * Called periodically to limit session hijacking window.
 *
 * @param leaseId - The lease ID
 * @returns The new raw session token for cookie update
 */
export async function rotateTenantSession(leaseId: string): Promise<string> {
  const supabase = createAdminClient();

  const rawSessionToken = generateSecureToken();
  const hashedSession = hashToken(rawSessionToken);

  await supabase
    .from("leases")
    .update({
      tenant_session_hash: hashedSession,
      tenant_last_access_at: new Date().toISOString(),
    })
    .eq("id", leaseId);

  return rawSessionToken;
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
 * Invalidate tenant session (logout)
 *
 * Clears the session hash in DB and logs the event.
 * Must be called before clearing the cookie client-side.
 *
 * @param leaseId - The lease ID
 */
export async function invalidateTenantSession(leaseId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("leases")
    .update({
      tenant_session_hash: null,
    })
    .eq("id", leaseId);

  await logTenantAccess("session_expired", leaseId);
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
 * Security:
 * - httpOnly: prevents JavaScript access
 * - secure: HTTPS only in production
 * - sameSite: strict (cookie is only set after server-side validation, not on magic link click)
 * - path: "/" to allow API routes access
 */
export const TENANT_SESSION_COOKIE_OPTIONS = {
  name: "tenant_session",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_EXPIRATION_HOURS * 60 * 60,
  path: "/",
};

/**
 * Get tenant session from cookie (server-side)
 *
 * Use this in Server Actions and API routes to get the current tenant session.
 * Validates against tenant_session_hash (not the magic link token).
 * Handles session rotation every 4 hours.
 *
 * @returns TenantSession if valid, null otherwise
 */
export async function getTenantSessionFromCookie(): Promise<TenantSession | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("tenant_session")?.value;

  if (!token) {
    return null;
  }

  // First try session hash validation (new system)
  const session = await validateTenantSession(token);
  if (session) {
    return session;
  }

  // Fallback: try legacy magic link token validation (for existing sessions)
  return validateTenantToken(token);
}

/**
 * Check if session needs rotation and rotate if needed
 *
 * @param leaseId - The lease ID
 * @returns New session token if rotated, null if no rotation needed
 */
export async function checkAndRotateSession(leaseId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: lease } = await supabase
    .from("leases")
    .select("tenant_last_access_at")
    .eq("id", leaseId)
    .single();

  if (!lease?.tenant_last_access_at) {
    return null;
  }

  const lastAccess = new Date(lease.tenant_last_access_at);
  const hoursSinceLastAccess = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastAccess >= SESSION_ROTATION_HOURS) {
    return rotateTenantSession(leaseId);
  }

  return null;
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

  // Fetch lease + property + owner info
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
      billing_day,
      start_date,
      end_date,
      status,
      property_address,
      lease_pdf_url,
      property:properties (
        id,
        title,
        location,
        details,
        images
      ),
      owner:profiles!leases_owner_id_fkey (
        full_name
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
    .select("id, amount_due, amount_paid, paid_at, payment_method, status, period_month, period_year, created_at, receipt_url")
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
