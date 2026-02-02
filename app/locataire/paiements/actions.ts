'use server';

import { createClient } from '@/utils/supabase/server';

export async function getTenantPayments() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }

    // Chercher le bail associé à l'email de l'utilisateur
    const { data: lease, error } = await supabase
        .from('leases')
        .select(`
            id,
            tenant_name,
            tenant_email,
            monthly_amount,
            property_address,
            property:properties(location)
        `)
        .eq('tenant_email', user.email)
        .eq('status', 'active')
        .single();

    if (error || !lease) {
        return null;
    }

    // Récupérer les paiements/transactions
    const { data: payments } = await supabase
        .from('rental_transactions')
        .select('*')
        .eq('lease_id', lease.id)
        .order('period_start', { ascending: false })
        .limit(24);

    const property = lease.property as { location?: { address?: string } } | null;

    return {
        payments: payments || [],
        leaseId: lease.id,
        monthlyAmount: lease.monthly_amount || 0,
        tenantName: lease.tenant_name || user.user_metadata?.full_name || 'Locataire',
        tenantEmail: lease.tenant_email || user.email || '',
        propertyAddress: property?.location?.address || lease.property_address || '',
    };
}
