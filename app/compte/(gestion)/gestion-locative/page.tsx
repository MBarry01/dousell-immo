import { RentalStats } from "./components/RentalStats";
import { getRentalStats } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GestionLocativePage({
    searchParams,
}: {
    searchParams?: Promise<{ view?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Unwrap searchParams (Next.js 15+)
    const params = await searchParams;

    // Déterminer le statut à afficher (actifs ou résiliés)
    const viewMode = params?.view === 'terminated' ? 'terminated' : 'active';
    const isViewingTerminated = viewMode === 'terminated';

    // ========================================
    // RÉCUPÉRATION DES VRAIES DONNÉES SUPABASE
    // ========================================

    // 0. Récupérer le profil pour les infos de quittance (Branding)
    // IMPORTANT: On récupère TOUS les champs nécessaires pour le fallback intelligent
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name')
        .eq('id', user.id)
        .maybeSingle();

    // 1. Récupérer tous les baux du propriétaire (colonnes explicites)
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, tenant_phone, tenant_email, property_address, monthly_amount, billing_day, start_date, end_date, status, created_at')
        .eq('owner_id', user.id)
        // TEMPORAIRE: Afficher TOUS les baux pour diagnostic
        // .eq('status', viewMode) // Dynamique: 'active' ou 'terminated'
        .order('created_at', { ascending: false });

    // Filtrer côté client selon le statut
    const filteredLeases = isViewingTerminated
        ? (leases || []).filter(l => l.status === 'terminated')
        : (leases || []).filter(l => !l.status || l.status === 'active' || l.status === 'pending');

    if (leasesError) {
        console.error("Erreur récupération baux:", leasesError.message);
    }

    // 1.5 Récupérer la date du tout premier bail (pour bloquer la navigation avant l'activité)
    const { data: earliestLease } = await supabase
        .from('leases')
        .select('start_date')
        .eq('owner_id', user.id)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

    const minDateStr = earliestLease?.start_date || new Date().toISOString();

    // 2. Récupérer TOUTES les transactions de loyer (pour tous les mois)
    const { data: rawTransactions, error: transError } = await supabase
        .from('rental_transactions')
        .select('id, lease_id, period_month, period_year, status, amount_due, paid_at, period_start, period_end')
        .in('lease_id', (filteredLeases || []).map(l => l.id))
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    // Polyfill pour amount_paid (car la colonne n'existe pas encore en base)
    // Cela permet au Finance Guard de fonctionner (Règle : Encaissé = amount_paid)
    // En attendant la migration DB, on assume que Payé = Totalité.
    const transactions = (rawTransactions || []).map(t => ({
        ...t,
        amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
    }));

    if (transError) {
        console.error("Erreur récupération transactions:", transError.message);
    }

    // ========================================
    // CALCUL DES STATISTIQUES (MODE RÉEL)
    // ========================================
    const stats = await getRentalStats();

    return (
        <div className="min-h-screen bg-slate-950 print:hidden">
            {/* Sub-header avec filtres Actifs/Résiliés */}
            <div className="border-b border-slate-800 bg-slate-900/50">
                <div className="w-full mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                            <Link
                                href="/compte/gestion-locative"
                                className={`px-3 py-1 text-xs font-medium rounded transition-all ${!isViewingTerminated
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Actifs
                            </Link>
                            <Link
                                href="/compte/gestion-locative?view=terminated"
                                className={`px-3 py-1 text-xs font-medium rounded transition-all ${isViewingTerminated
                                    ? 'bg-orange-500/10 text-orange-400'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Résiliés
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isViewingTerminated && <AddTenantButton ownerId={user.id} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                {/* Table des locataires - Pleine largeur */}
                <GestionLocativeClient
                    leases={filteredLeases || []}
                    transactions={transactions || []}
                    profile={profile}
                    userEmail={user.email}
                    isViewingTerminated={isViewingTerminated}
                    minDate={minDateStr}
                />
            </div>
        </div>
    );
}
