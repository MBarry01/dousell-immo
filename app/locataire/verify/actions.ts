"use server";

import { cookies } from "next/headers";
import {
  validateTenantToken,
  validateTenantIdentity,
  markTenantTokenVerified,
  revokeTenantToken,
  TENANT_SESSION_COOKIE_OPTIONS,
  getTenantFailedAttempts,
} from "@/lib/tenant-magic-link";

// Track failed attempts limit
const MAX_ATTEMPTS = 3;

/**
 * Verify tenant identity by last name
 *
 * Security measures:
 * - Max 3 attempts per token (persistent via DB logging)
 * - Token is invalidated after max attempts
 * - Creates session cookie on success
 *
 * @param token - The tenant access token
 * @param lastName - The last name provided by the user
 */
export async function verifyTenantIdentity(token: string, lastName: string) {
  // Check if token exists and is valid
  const session = await validateTenantToken(token);

  if (!session) {
    return { error: "Ce lien n'est plus valide." };
  }

  // Check persistent failed attempts
  const attempts = await getTenantFailedAttempts(session.lease_id);

  if (attempts >= MAX_ATTEMPTS) {
    // Revoke token after max attempts
    await revokeTenantToken(session.lease_id);
    return { error: "Trop de tentatives. Ce lien a été invalidé." };
  }

  // Validate identity
  const isValid = await validateTenantIdentity(session.lease_id, lastName);

  if (!isValid) {
    // Failed attempt is already logged by validateTenantIdentity in DB
    const newAttempts = attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      // Revoke token after max attempts
      await revokeTenantToken(session.lease_id);
      return { error: "Trop de tentatives. Ce lien a été invalidé." };
    }

    return { error: "Nom incorrect." };
  }

  // Mark token as verified
  await markTenantTokenVerified(session.lease_id);

  // Create session cookie
  const cookieStore = await cookies();
  cookieStore.set(TENANT_SESSION_COOKIE_OPTIONS.name, token, {
    httpOnly: TENANT_SESSION_COOKIE_OPTIONS.httpOnly,
    secure: TENANT_SESSION_COOKIE_OPTIONS.secure,
    sameSite: TENANT_SESSION_COOKIE_OPTIONS.sameSite,
    maxAge: TENANT_SESSION_COOKIE_OPTIONS.maxAge,
    path: TENANT_SESSION_COOKIE_OPTIONS.path,
  });

  return { success: true };
}

/**
 * Activate tenant session for an already-verified token
 *
 * Used when a tenant re-clicks their magic link but their cookie has expired.
 * The token is still valid and verified in DB, so we just create the session cookie.
 *
 * @param token - The tenant access token
 */
export async function activateTenantSession(token: string) {
  const session = await validateTenantToken(token);

  if (!session) {
    return { error: "Ce lien n'est plus valide." };
  }

  if (!session.verified) {
    // Not yet verified - return session context for the UI
    return {
      needsVerification: true,
      tenantName: session.tenant_name,
      propertyAddress: session.property_address,
      propertyTitle: session.property_title,
    };
  }

  // Token is already verified - just create the session cookie
  const cookieStore = await cookies();
  cookieStore.set(TENANT_SESSION_COOKIE_OPTIONS.name, token, {
    httpOnly: TENANT_SESSION_COOKIE_OPTIONS.httpOnly,
    secure: TENANT_SESSION_COOKIE_OPTIONS.secure,
    sameSite: TENANT_SESSION_COOKIE_OPTIONS.sameSite,
    maxAge: TENANT_SESSION_COOKIE_OPTIONS.maxAge,
    path: TENANT_SESSION_COOKIE_OPTIONS.path,
  });

  return { success: true };
}
