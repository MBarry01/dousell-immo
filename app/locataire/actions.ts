'use server';

import { redirect } from 'next/navigation';
import { getTenantSessionFromCookie, getTenantLeaseData } from '@/lib/tenant-magic-link';

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

    // If not verified yet, redirect to verification
    if (!session.verified) {
        // The verify page needs the token, but we have the session
        // The token is in the cookie, so redirect to verify with a flag
        redirect('/locataire/verify?from=dashboard');
    }

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
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const hasCurrentMonthPayment = payments.some((p: any) => {
        if (!p.period_start) return false;
        const paymentDate = new Date(p.period_start);
        return (
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear &&
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
