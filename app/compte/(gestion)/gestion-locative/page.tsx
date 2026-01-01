import { RentalStats } from "./components/RentalStats";
import { getRentalStats } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";
import { MaintenanceHub } from "./components/MaintenanceHub";
import { LegalAlertsWidget } from "./components/LegalAlertsWidget";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLeasesByOwner, getRentalTransactions, getOwnerProfileForReceipts } from "@/services/rentalService.cached";

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

    // 0. Récupérer le profil pour les infos de quittance (Branding) - AVEC CACHE
    const profile = await getOwnerProfileForReceipts(user.id);

    // 1. Récupérer tous les baux du propriétaire - AVEC CACHE
    const allLeases = await getLeasesByOwner(user.id, "all");

    // Filtrer côté client selon le statut
    const filteredLeases = isViewingTerminated
        ? allLeases.filter(l => l.status === 'terminated')
        : allLeases.filter(l => !l.status || l.status === 'active' || l.status === 'pending');

    // 1.5 Récupérer la date du tout premier bail (pour bloquer la navigation avant l'activité)
    const { data: earliestLease } = await supabase
        .from('leases')
        .select('start_date')
        .eq('owner_id', user.id)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

    const minDateStr = earliestLease?.start_date || new Date().toISOString();

    // 2. Récupérer TOUTES les transactions de loyer (pour tous les mois) - AVEC CACHE
    const leaseIds = filteredLeases.map(l => l.id);
    const rawTransactions = await getRentalTransactions(leaseIds);

    // Polyfill pour amount_paid (car la colonne n'existe pas encore en base)
    // Cela permet au Finance Guard de fonctionner (Règle : Encaissé = amount_paid)
    // En attendant la migration DB, on assume que Payé = Totalité.
    const transactions = rawTransactions.map(t => ({
        ...t,
        amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
    }));

    // 3. Récupérer les demandes de maintenance (avec infos artisan) - Aperçu seulement
    const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, description, status, created_at, lease_id, artisan_name, artisan_phone, artisan_rating, artisan_address, quoted_price, intervention_date, owner_approved')
        .order('created_at', { ascending: false })
        .neq('status', 'completed')
        .limit(5); // Limiter à 5 pour l'aperçu

    const maintenanceRequests = maintenanceData || [];

    if (maintenanceError) {
        console.error("Erreur récupération maintenance:", maintenanceError.message);
    }

    // ========================================
    // CALCUL DES STATISTIQUES (MODE RÉEL)
    // ========================================
    const stats = await getRentalStats();

    // Transformer les demandes de maintenance pour MaintenanceHub
    const formattedRequests = (maintenanceRequests || []).map(req => {
        const categoryMatch = req.description?.match(/\[([^\]]+)\]$/);
        const category = categoryMatch ? categoryMatch[1] : undefined;
        const cleanDescription = category ? req.description.replace(` [${category}]`, '') : req.description;

        return {
            id: req.id,
            description: cleanDescription,
            category: category,
            status: req.status,
            created_at: req.created_at,
            artisan_name: req.artisan_name,
            artisan_phone: req.artisan_phone,
            artisan_rating: req.artisan_rating,
            artisan_address: req.artisan_address,
            quoted_price: req.quoted_price,
            intervention_date: req.intervention_date,
            owner_approved: req.owner_approved
        };
    });

    return (
        <div className="min-h-screen bg-slate-950 print:hidden">
            {/* Sub-header avec filtres Actifs/Résiliés */}
            <div className="border-b border-slate-800 bg-slate-900/50">
                <div className="w-full mx-auto px-4 md:px-6 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                            {!isViewingTerminated && <AddTenantButton ownerId={user.id} profile={profile} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                {/* Table des locataires - Pleine largeur */}
                <div className="mb-6">
                    <GestionLocativeClient
                        leases={filteredLeases || []}
                        transactions={transactions || []}
                        profile={profile}
                        userEmail={user.email}
                        ownerId={user.id}
                        isViewingTerminated={isViewingTerminated}
                        minDate={minDateStr}
                    />
                </div>

                {/* Widgets Dashboard - Vue d'ensemble */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                    {/* Interventions - Aperçu */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Interventions Récentes</h3>
                            <Link
                                href="/compte/interventions"
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Voir tout →
                            </Link>
                        </div>
                        <MaintenanceHub requests={formattedRequests} />
                    </div>

                    {/* Alertes Juridiques */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Alertes Juridiques</h3>
                            <Link
                                href="/compte/legal"
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Voir tout →
                            </Link>
                        </div>
                        <LegalAlertsWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
