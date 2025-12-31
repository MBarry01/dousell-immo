'use server';

import { createClient } from '@/utils/supabase/server';
import { initializeRentalPayment } from '@/lib/paydunya';
import { redirect } from 'next/navigation';

export async function processRentalPayment(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "Non authentifié" };
    }

    // 1. Récupérer les détails du bail et du montant dû
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // On cherche la transaction en attente pour ce mois (ou la plus ancienne impayée)
    // Pour simplifier ici, on prend le montant mensuel du bail
    const { data: lease, error } = await supabaseAdmin
        .from('leases')
        .select('*, tenant_name') // Assurez-vous que tenant_name est bien dans leases
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
            lease.monthly_amount, // Montant du loyer
            currentMonth,
            currentYear,
            user.email,
            lease.tenant_name || user.user_metadata?.full_name || 'Locataire',
            user.user_metadata?.phone
        );

        return { url: result.redirectUrl };
    } catch (e: any) {
        console.error("Erreur init paiement:", e);
        return { error: "Impossible d'initialiser le paiement: " + e.message };
    }
}
