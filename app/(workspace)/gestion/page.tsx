import { getRentalStats, getAdvancedStats, getRevenueHistory } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";

import { DocumentGeneratorDialog } from "./components/DocumentGeneratorDialog";
import { ThemedContent } from "./components/ThemedContent";
import { KPICards } from "./components/KPICards";
import { RevenueChart } from "./components/RevenueChart";
import { OrphanLeasesAlert } from "./components/OrphanLeasesAlert";
import { ExpiredBanner } from "./components/ExpiredBanner";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
    getLeasesByTeam as getLeasesByOwner,
    getRentalTransactions,
    getOwnerProfileForReceipts,
    getExpensesByTeam as getExpensesByOwner
} from "@/services/rentalService.cached";
import { getUserTeamContext } from "@/lib/team-context";

// Force dynamic rendering to prevent stale RSC cache on navigation
export const dynamic = "force-dynamic";



export default async function GestionLocativePage({
    searchParams,
}: {
    searchParams?: Promise<{ view?: string; upgrade?: string }>;
}) {
    // Helper pour timeout avec fallback gracieux (ne bloque jamais)
    async function withTimeoutSafe<T>(
        promise: Promise<T>,
        name: string,
        fallback: T,
        ms: number = 8000 // Augmenté pour mobile stable
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((resolve) =>
                setTimeout(() => {
                    console.warn(`[DASHBOARD] TIMEOUT: ${name} (${ms}ms) - using fallback`);
                    resolve(fallback);
                }, ms)
            )
        ]).catch(error => {
            console.error(`[DASHBOARD] Error in ${name}:`, error);
            return fallback;
        });
    }

    // 1. Initialisation - Essayer de récupérer le contexte rapidement
    const context = await withTimeoutSafe(getUserTeamContext(), 'getUserTeamContext', null, 5000);

    if (!context) {
        // Fallback critique si le contexte hang totalement
        console.error("[DASHBOARD] Critical failure: getUserTeamContext hang/error");
        // On redirige vers un état stable
        redirect("/auth/login?reason=timeout");
    }

    const { teamId, user, team, role } = context!;
    const supabase = await createClient();

    // Unwrap searchParams (Next.js 15+)
    const params = await searchParams;

    // Déterminer le statut à afficher (actifs ou résiliés)
    const viewMode = params?.view === 'terminated' ? 'terminated' : 'active';
    const isViewingTerminated = viewMode === 'terminated';

    // ========================================
    // RÉCUPÉRATION OPTIMISÉE - PARALLÉLISATION
    // ========================================

    // Étape 1 : Lancer toutes les requêtes EN PARALLÈLE avec fallbacks
    const [
        userProfileResult,
        profile,
        allLeases,
        earliestLeaseResult,
        advancedStats,
        revenueHistory,
        expenses
    ] = await Promise.all([
        // Statut pro
        withTimeoutSafe(
            Promise.resolve(supabase.from("profiles").select("pro_status").eq("id", user.id).single()),
            'getProStatus',
            { data: { pro_status: 'none' } } as any
        ),
        // Profil pour les infos de quittance
        withTimeoutSafe(getOwnerProfileForReceipts(user.id), 'getOwnerProfileForReceipts', null),
        // Tous les baux du propriétaire
        withTimeoutSafe(getLeasesByOwner(teamId, "all"), 'getLeasesByOwner', []),
        // Date du premier bail
        withTimeoutSafe<{ start_date: string } | null>(
            (async () => {
                const { data } = await supabase
                    .from('leases')
                    .select('start_date')
                    .eq('team_id', teamId)
                    .order('start_date', { ascending: true })
                    .limit(1)
                    .single();
                return data;
            })(),
            'getEarliestLease',
            null
        ),
        // Stats avancées pour les KPIs
        withTimeoutSafe(getAdvancedStats(), 'getAdvancedStats', {
            totalProperties: 0,
            activeLeases: 0,
            occupancyRate: 0,
            avgPaymentDelay: 0,
            unpaidRate: 0,
            avgRevenuePerProperty: 0
        }),
        // Historique des revenus pour le graphique
        withTimeoutSafe(getRevenueHistory(12), 'getRevenueHistory', []),
        // Dépenses
        withTimeoutSafe(getExpensesByOwner(teamId), 'getExpensesByOwner', [])
    ]);

    // Extraire les données des résultats (avec fallbacks)
    const proStatus = (userProfileResult as any)?.data?.pro_status || "none";
    const earliestLease = earliestLeaseResult; // Déjà extrait dans la Promise
    const expensesList = expenses || [];


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
    const rawTransactions = await withTimeoutSafe(
        getRentalTransactions(leaseIds),
        'getRentalTransactions',
        [],
        4000
    );

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
            {/* Banner for expired subscription */}
            {proStatus === "expired" && (
                <ExpiredBanner
                    proStatus={proStatus}
                    propertiesCount={allLeases.length}
                    leasesCount={filteredLeases.length}
                />
            )}

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
                    expenses={expensesList || []}
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
