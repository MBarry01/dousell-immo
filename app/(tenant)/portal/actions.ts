'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export interface TenantDashboardData {
    hasLease: boolean;
    lease?: any;
    isUpToDate?: boolean;
    tenantName?: string;
}

export async function getTenantDashboardData(): Promise<TenantDashboardData> {
    const supabase = await createClient();

    // 1. Qui est connecté ?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // 2. Trouver le bail actif associé à cet email
    // On utilise le client ADMIN pour contourner les RLS (Row Level Security)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");

    // Debug: Vérifier la présence de la clé (sans l'afficher)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("🚨 CRITIQUE: SUPABASE_SERVICE_ROLE_KEY manquante ! Impossible de contourner les RLS.");
        return { hasLease: false };
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    console.log(`🔍 Recherche de bail pour locataire: ${user.email}`);

    const { data: lease, error } = await supabaseAdmin
        .from('leases')
        .select(`
      *,
      property:properties(title, location),
      owner:profiles(full_name, phone),
      payments:rental_transactions(id, status, amount_due, period_start, period_end, paid_at)
    `)
        .eq('tenant_email', user.email)
        .eq('status', 'active') // Seulement le bail en cours
        .maybeSingle();

    if (error) {
        console.error("🚨 Erreur récupération bail locataire (Détails):", JSON.stringify(error, null, 2));
    }

    if (!lease) {
        console.log("❌ Aucun bail actif trouvé pour cet email via Admin Client.");
        return { hasLease: false };
    }

    console.log("✅ Bail trouvé avec succès:", lease.id);

    // 3. Calculs financiers simples

    if (error) {
        console.error("Erreur récupération bail locataire:", error);
    }

    if (!lease) {
        // Cas : L'utilisateur est connecté mais n'a pas de bail associé
        return { hasLease: false };
    }

    // 3. Calculs financiers simples
    // On regarde la dernière transaction pour voir si elle est payée
    // TODO: Affiner la logique pour trouver la transaction du mois COURANT
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const payments = lease.payments || [];

    // Trier par date décroissante
    payments.sort((a: any, b: any) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime());

    const lastPayment = payments[0];
    const isUpToDate = lastPayment?.status === 'paid';

    return {
        hasLease: true,
        lease,
        isUpToDate,
        tenantName: lease.tenant_name
    };
}
