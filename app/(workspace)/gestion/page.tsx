import { RentalStats } from "./components/RentalStats";
import { getRentalStats, getAdvancedStats, getRevenueHistory } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";

import { DocumentGeneratorDialog } from "./components/DocumentGeneratorDialog";
import { ThemedContent, ThemedWidget } from "./components/ThemedContent";
import { KPICards } from "./components/KPICards";
import { RevenueChart } from "./components/RevenueChart";
import { Button } from "@/components/ui/button";
import { FileText, Plus, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { OrphanLeasesAlert } from "./components/OrphanLeasesAlert";
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
    // RÉCUPÉRATION OPTIMISÉE - PARALLÉLISATION
    // ========================================

    // Étape 1 : Lancer toutes les requêtes indépendantes EN PARALLÈLE
    const [
        profile,
        allLeases,
        earliestLeaseResult,
        advancedStats,
        revenueHistory
    ] = await Promise.all([
        // Profil pour les infos de quittance (AVEC CACHE)
        getOwnerProfileForReceipts(user.id),
        // Tous les baux du propriétaire (AVEC CACHE)
        getLeasesByOwner(user.id, "all"),
        // Date du premier bail
        supabase
            .from('leases')
            .select('start_date')
            .eq('owner_id', user.id)
            .order('start_date', { ascending: true })
            .limit(1)
            .single(),
        // Stats avancées pour les KPIs
        getAdvancedStats(),
        // Historique des revenus pour le graphique
        getRevenueHistory(12)
    ]);

    // Extraire les données des résultats
    const earliestLease = earliestLeaseResult.data;


    // Filtrer les baux côté client selon le statut
    const filteredLeases = isViewingTerminated
        ? allLeases.filter(l => l.status === 'terminated')
        : allLeases.filter(l => !l.status || l.status === 'active' || l.status === 'pending');

    // Compter les baux orphelins (sans property_id)
    const orphanLeases = filteredLeases.filter(l => !l.property_id);
    const orphanCount = orphanLeases.length;

    // On limite la navigation à la date du premier bail
    const minDateStr = earliestLease?.start_date || new Date().toISOString();

    // Étape 2 : Récupérer les transactions (dépend des leases filtrés)
    const leaseIds = filteredLeases.map(l => l.id);
    const rawTransactions = await getRentalTransactions(leaseIds);

    // Polyfill pour amount_paid
    const transactions = rawTransactions.map(t => ({
        ...t,
        amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
    }));



    return (
        <ThemedContent
            isViewingTerminated={isViewingTerminated}
            filterSection={
                !isViewingTerminated && (
                    <>
                        <DocumentGeneratorDialog
                            leases={filteredLeases}
                            userEmail={user.email}
                            profile={profile}
                        />
                        <AddTenantButton ownerId={user.id} profile={profile} />
                    </>
                )
            }
        >
            {/* Alerte baux orphelins */}
            {!isViewingTerminated && orphanCount > 0 && (
                <OrphanLeasesAlert count={orphanCount} leases={orphanLeases} />
            )}

            {/* KPI Cards - Seulement en mode actif */}
            {!isViewingTerminated && (
                <KPICards stats={advancedStats} />
            )}

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

            {/* Graphique des revenus - Seulement en mode actif */}
            {!isViewingTerminated && (
                <RevenueChart data={revenueHistory} />
            )}

        </ThemedContent>
    );
}
