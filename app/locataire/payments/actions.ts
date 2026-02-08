'use server';

import { initializeRentalPayment } from '@/lib/paydunya';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * Process rental payment
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function processRentalPayment(leaseId: string): Promise<
    | { success: true; data: { url: string } }
    | { success: false; error: string }
    | { error: string }
> {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    // Verify the lease matches the session
    if (session.lease_id !== leaseId) {
        return { error: "Accès non autorisé" };
    }

    // Initialize Admin Client
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get lease details
    const { data: lease, error } = await supabaseAdmin
        .from('leases')
        .select('*, tenant_name, tenant_email')
        .eq('id', leaseId)
        .single();

    if (error || !lease) {
        console.error("Erreur bail:", error);
        return { error: "Bail introuvable" };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    try {
        const result = await initializeRentalPayment(
            lease.id,
            lease.monthly_amount,
            currentMonth,
            currentYear,
            session.tenant_email || lease.tenant_email,
            session.tenant_name || lease.tenant_name || 'Locataire',
            undefined // phone - not available in cookie session
        );

        return { success: true, data: { url: result.redirectUrl } };
    } catch (e) {
        console.error("Erreur init paiement:", e);
        const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
        return { success: false, error: "Impossible d'initialiser le paiement: " + errorMessage };
    }
}

/**
 * Process custom amount rental payment
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function processCustomRentalPayment(leaseId: string, customAmount: number): Promise<
    | { success: true; data: { url: string } }
    | { success: false; error: string }
    | { error: string }
> {
    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    // Verify the lease matches the session
    if (session.lease_id !== leaseId) {
        return { error: "Accès non autorisé" };
    }

    if (!customAmount || customAmount <= 0) {
        return { error: "Montant invalide" };
    }

    // Initialize Admin Client
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get lease details
    const { data: lease, error } = await supabaseAdmin
        .from('leases')
        .select('*, tenant_name, tenant_email')
        .eq('id', leaseId)
        .single();

    if (error || !lease) {
        console.error("Erreur bail:", error);
        return { error: "Bail introuvable" };
    }

    // Validation: amount cannot exceed 12 months of rent
    if (customAmount > lease.monthly_amount * 12) {
        return { error: "Le montant ne peut pas dépasser 12 mois de loyer" };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    try {
        const result = await initializeRentalPayment(
            lease.id,
            customAmount,
            currentMonth,
            currentYear,
            session.tenant_email || lease.tenant_email,
            session.tenant_name || lease.tenant_name || 'Locataire',
            undefined // phone - not available in cookie session
        );

        return { success: true, data: { url: result.redirectUrl } };
    } catch (e) {
        console.error("Erreur init paiement personnalisé:", e);
        const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
        return { success: false, error: "Impossible d'initialiser le paiement: " + errorMessage };
    }
}
