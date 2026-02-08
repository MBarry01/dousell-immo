'use server';

import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * Get tenant payments
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function getTenantPayments() {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return null;
    }

    // Initialize Admin Client (to bypass RLS)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get lease details
    const { data: lease, error } = await supabaseAdmin
        .from('leases')
        .select(`
            id,
            tenant_name,
            tenant_email,
            monthly_amount,
            property_address,
            property:properties(location)
        `)
        .eq('id', session.lease_id)
        .single();

    if (error || !lease) {
        return null;
    }

    // Get payments/transactions
    const { data: payments } = await supabaseAdmin
        .from('rental_transactions')
        .select('*')
        .eq('lease_id', lease.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .limit(24);

    const property = lease.property as { location?: { address?: string } } | null;

    return {
        payments: payments || [],
        leaseId: lease.id,
        monthlyAmount: lease.monthly_amount || 0,
        tenantName: session.tenant_name || lease.tenant_name || 'Locataire',
        tenantEmail: session.tenant_email || lease.tenant_email || '',
        propertyAddress: property?.location?.address || lease.property_address || session.property_address || '',
    };
}
