'use server';

import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * Get transaction detail by ID
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function getTransactionDetail(transactionId: string) {
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

    // Get transaction with lease details
    const { data: transaction, error } = await supabaseAdmin
        .from('rental_transactions')
        .select(`
            *,
            lease:leases(
                id,
                tenant_name,
                tenant_email,
                monthly_amount,
                property_address,
                property:properties(location)
            )
        `)
        .eq('id', transactionId)
        .eq('lease_id', session.lease_id)
        .single();

    if (error || !transaction) {
        return null;
    }

    const lease = transaction.lease as {
        id: string;
        tenant_name: string;
        tenant_email: string;
        monthly_amount: number;
        property_address: string;
        property: { location?: { address?: string } } | null;
    } | null;

    const property = lease?.property;

    return {
        transaction,
        lease: lease ? {
            id: lease.id,
            tenant_name: session.tenant_name || lease.tenant_name || 'Locataire',
            tenant_email: session.tenant_email || lease.tenant_email || '',
            monthly_amount: lease.monthly_amount || 0,
            property_address: property?.location?.address || lease.property_address || session.property_address || '',
        } : null,
    };
}
