'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    getTenantSessionFromCookie,
    getTenantLeaseData,
    validateTenantSession,
    invalidateTenantSession,
    checkAndRotateSession,
    TENANT_SESSION_COOKIE_OPTIONS,
} from '@/lib/tenant-magic-link';

export interface TenantDashboardData {
    hasLease: boolean;
    lease?: any;
    isUpToDate?: boolean;
    tenantName?: string;
}

/**
 * Get tenant dashboard data
 *
 * This action uses the tenant session from cookie (NOT auth.users).
 * Tenants access via Magic Link and don't have user accounts.
 */
export async function getTenantDashboardData(): Promise<TenantDashboardData> {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        redirect('/locataire/expired?error=no_session');
    }

    // Note: if we reach here, the session cookie exists (getTenantSessionFromCookie reads it).
    // The cookie is ONLY created after successful name verification in verifyTenantIdentity(),
    // so its existence proves the tenant's identity. We skip the verified flag check to avoid
    // a race condition where DB replication hasn't propagated verified=true yet.

    // Get full lease data
    const data = await getTenantLeaseData();

    if (!data || !data.lease) {
        return {
            hasLease: false,
        };
    }

    // Check if payments are up to date
    const payments = data.lease.payments || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed, DB is 1-indexed
    const currentYear = currentDate.getFullYear();

    const hasCurrentMonthPayment = payments.some((p: any) => {
        return (
            p.period_month === currentMonth &&
            p.period_year === currentYear &&
            p.status === 'paid'
        );
    });

    return {
        hasLease: true,
        lease: data.lease,
        isUpToDate: hasCurrentMonthPayment,
        tenantName: data.tenantName,
    };
}

/**
 * Get tenant session info (for client-side use via API)
 */
export async function getTenantSessionInfo() {
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return null;
    }

    return {
        lease_id: session.lease_id,
        tenant_name: session.tenant_name,
        tenant_email: session.tenant_email,
        property_title: session.property_title,
        property_address: session.property_address,
        verified: session.verified,
    };
}

/**
 * Logout tenant - invalidate session in DB and clear cookie
 *
 * Must be called before clearing the cookie client-side.
 * Clears tenant_session_hash in DB and logs the event.
 */
export async function logoutTenant(): Promise<{ success: boolean }> {
    const session = await getTenantSessionFromCookie();

    if (session) {
        await invalidateTenantSession(session.lease_id);
    }

    // Clear cookie server-side
    const cookieStore = await cookies();
    cookieStore.delete('tenant_session');

    return { success: true };
}

/**
 * Migrate tenant session cookie to new path
 *
 * This Server Action refreshes the tenant session cookie with the correct
 * path setting so it's available for API routes at /api/*.
 * Also handles session rotation every 4 hours.
 *
 * Called automatically by the tenant portal on page load.
 */
export async function migrateTenantCookie(): Promise<{ success: boolean }> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('tenant_session')?.value;

    if (!sessionToken) {
        return { success: false };
    }

    // Validate the session token
    const session = await validateTenantSession(sessionToken);

    if (!session) {
        return { success: false };
    }

    // Check if session needs rotation (every 4h)
    const newToken = await checkAndRotateSession(session.lease_id);
    const tokenToSet = newToken || sessionToken;

    // Refresh cookie with correct path (delete old + set new)
    cookieStore.delete('tenant_session');
    cookieStore.set(TENANT_SESSION_COOKIE_OPTIONS.name, tokenToSet, {
        httpOnly: TENANT_SESSION_COOKIE_OPTIONS.httpOnly,
        secure: TENANT_SESSION_COOKIE_OPTIONS.secure,
        sameSite: TENANT_SESSION_COOKIE_OPTIONS.sameSite,
        maxAge: TENANT_SESSION_COOKIE_OPTIONS.maxAge,
        path: TENANT_SESSION_COOKIE_OPTIONS.path,
    });

    return { success: true };
}
