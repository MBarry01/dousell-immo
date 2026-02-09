import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";
import { DocumentGeneratorDialog } from "./components/DocumentGeneratorDialog";
import { ThemedContent } from "./components/ThemedContent";
import { KPICards } from "./components/KPICards";
import { RevenueChart } from "./components/RevenueChart";
import { OrphanLeasesAlert } from "./components/OrphanLeasesAlert";
import { ExpiredBanner } from "./components/ExpiredBanner";
import { QuotaBanner } from "./components/QuotaBanner";
import { GestionTour } from "@/components/gestion/GestionTour";
import { createClient } from "@/utils/supabase/server";
import {
    getLeasesByTeam as getLeasesByOwner,
    getRentalTransactions,
    getOwnerProfileForReceipts,
    getExpensesByTeam as getExpensesByOwner,
} from "@/services/rentalService.cached";

const LOG_PREFIX = "[Gestion/dash-content]";

export default async function DashboardContent({
    context,
    searchParams
}: {
    context: any,
    searchParams?: any
}) {
    const t0 = Date.now();
    const { teamId, user, team } = context;
    console.log(LOG_PREFIX, "▶ Début fetch données", { teamId: teamId?.slice(0, 8), userId: user?.id?.slice(0, 8) });

    const supabase = await createClient();

    const params = await searchParams;
    const viewMode = params?.view === 'terminated' ? 'terminated' : 'active';
    const isViewingTerminated = viewMode === 'terminated';

    // ========================================
    // PATTERN /BIENS : Fetch données brutes EN PARALLÈLE
    // 5 requêtes simples au lieu de ~15 avec waterfalls
    // ========================================
    const fetchTimers = {
        profile: 0,
        leases: 0,
        transactions: 0,
        expenses: 0,
        properties: 0,
    };

    const results = await Promise.allSettled([
        (async () => {
            const t = Date.now();
            const r = await getOwnerProfileForReceipts(user.id);
            fetchTimers.profile = Date.now() - t;
            return r;
        })(),
        (async () => {
            const t = Date.now();
            const r = await getLeasesByOwner(teamId, "all");
            fetchTimers.leases = Date.now() - t;
            return r;
        })(),
        (async () => {
            const t = Date.now();
            const r = await getRentalTransactions([], teamId);
            fetchTimers.transactions = Date.now() - t;
            return r;
        })(),
        (async () => {
            const t = Date.now();
            const r = await getExpensesByOwner(teamId);
            fetchTimers.expenses = Date.now() - t;
            return r;
        })(),
        (async () => {
            const t = Date.now();
            const r = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("team_id", teamId);
            fetchTimers.properties = Date.now() - t;
            return r;
        })(),
    ]);

    // Log chaque résultat
    const labels = ["profile", "leases", "transactions", "expenses", "properties"] as const;
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "rejected") {
            console.error(LOG_PREFIX, `✗ ${labels[i]} FAILED en ${fetchTimers[labels[i]]}ms:`, r.reason);
        } else {
            const val = r.value;
            const size = Array.isArray(val) ? val.length : (val && typeof val === 'object' && 'count' in val) ? val.count : '1 obj';
            console.log(LOG_PREFIX, `✓ ${labels[i]} OK en ${fetchTimers[labels[i]]}ms (${size} résultats)`);
        }
    }

    console.log(LOG_PREFIX, "⏱ Total fetch:", Date.now() - t0, "ms");

    // Extraire les valeurs (fallback gracieux si une requête échoue)
    const profile = results[0].status === "fulfilled" ? results[0].value : null;
    const allLeases: any[] = results[1].status === "fulfilled" ? (results[1].value as any[] || []) : [];
    const rawTransactions: any[] = results[2].status === "fulfilled" ? (results[2].value as any[] || []) : [];
    const expenses: any[] = results[3].status === "fulfilled" ? (results[3].value as any[] || []) : [];
    const totalProperties = results[4].status === "fulfilled" ? (results[4].value as any)?.count ?? 0 : 0;

    // Log erreurs critiques mais on continue le rendu
    const failedQueries = results.filter(r => r.status === "rejected");
    if (failedQueries.length > 0) {
        console.error(LOG_PREFIX, `⚠ ${failedQueries.length}/5 requêtes ont échoué, rendu partiel`);
    }

    if (allLeases.length === 0 && rawTransactions.length === 0) {
        console.warn(LOG_PREFIX, "⚠ Aucune donnée de bail ni transaction - dashboard sera vide");
    }

    // ========================================
    // CALCULS INLINE depuis les données brutes (ZERO requête supplémentaire)
    // ========================================

    // --- Advanced Stats (KPI Cards) ---
    const activeLeases = allLeases.filter((l: any) => l.status === 'active');
    const activeLeasesCount = activeLeases.length;

    // Taux d'occupation
    let occupancyBase = totalProperties || 0;
    if (occupancyBase === 0 && activeLeasesCount > 0) {
        const uniqueAddresses = new Set(
            activeLeases.map((l: any) => l.property_address?.toLowerCase().trim())
        );
        occupancyBase = uniqueAddresses.size;
    }
    const occupancyRate = Math.min(
        occupancyBase > 0
            ? Math.round((activeLeasesCount / occupancyBase) * 100)
            : activeLeasesCount > 0 ? 100 : 0,
        100
    );

    // Delai moyen de paiement
    const leaseMap = new Map(activeLeases.map((l: any) => [l.id, l]));
    const paidTxs = rawTransactions
        .filter((t: any) => t.status === 'paid' && t.paid_at)
        .slice(0, 50);

    let totalDelay = 0, delayCount = 0;
    for (const t of paidTxs) {
        const lease = leaseMap.get(t.lease_id);
        if (lease && t.period_month && t.period_year) {
            const billingDay = lease.billing_day || 5;
            const expected = new Date(t.period_year, t.period_month - 1, billingDay);
            const paid = new Date(t.paid_at);
            const diff = Math.floor((paid.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0) { totalDelay += diff; delayCount++; }
        }
    }
    const avgPaymentDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

    // Taux d'impayes
    const failedCount = rawTransactions.filter(
        (t: any) => t.status === 'failed' || t.status === 'rejected'
    ).length;
    const unpaidRate = rawTransactions.length > 0
        ? Math.round((failedCount / rawTransactions.length) * 100)
        : 0;

    // Revenu moyen par bien
    const totalMonthlyRevenue = activeLeases.reduce(
        (acc: number, l: any) => acc + Number(l.monthly_amount), 0
    );
    const avgRevenuePerProperty = activeLeasesCount > 0
        ? Math.round(totalMonthlyRevenue / activeLeasesCount)
        : 0;

    const advancedStats = {
        occupancyRate,
        avgPaymentDelay,
        unpaidRate,
        avgRevenuePerProperty,
        totalProperties: totalProperties || 0,
        activeLeases: activeLeasesCount,
    };

    // --- Revenue History (Graphique 12 mois) ---
    const today = new Date();
    const txByMonth = new Map<string, { collected: number; expected: number }>();
    for (const t of rawTransactions) {
        const key = `${t.period_year}-${t.period_month}`;
        const entry = txByMonth.get(key) || { collected: 0, expected: 0 };
        const amount = Number(t.amount_due || 0);
        entry.expected += amount;
        if (t.status === 'paid') entry.collected += amount;
        txByMonth.set(key, entry);
    }

    const revenueHistory = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthNum = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthName = date.toLocaleDateString("fr-FR", { month: "short" });
        const entry = txByMonth.get(`${year}-${monthNum}`) || { collected: 0, expected: 0 };
        revenueHistory.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            year,
            monthNum,
            collected: entry.collected,
            expected: entry.expected,
        });
    }

    // --- Earliest lease (depuis les données déjà chargées) ---
    const earliestLease = allLeases.reduce(
        (earliest: any, l: any) => {
            if (!l.start_date) return earliest;
            if (!earliest || l.start_date < earliest.start_date) return { start_date: l.start_date };
            return earliest;
        },
        null as { start_date: string } | null
    );

    // ========================================
    // FILTRAGE (identique à avant)
    // ========================================
    const currentTier = team?.subscription_tier || "starter";
    const proStatus = context?.subscription_status || "none";
    const expensesList = expenses || [];

    const filteredLeases = isViewingTerminated
        ? allLeases.filter((l: any) => l.status === 'terminated')
        : allLeases.filter((l: any) => !l.status || l.status === 'active' || l.status === 'pending');

    const orphanLeases = filteredLeases.filter((l: any) => !l.property_id);
    const orphanCount = orphanLeases.length;
    const minDateStr = earliestLease?.start_date || new Date().toISOString();

    const leaseIdSet = new Set(filteredLeases.map((l: any) => l.id));
    const transactions = rawTransactions
        .filter((t: any) => leaseIdSet.has(t.lease_id))
        .map((t: any) => ({
            ...t,
            amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
        }));

    return (
        <ThemedContent
            isViewingTerminated={isViewingTerminated}
            filterSection={
                !isViewingTerminated && (
                    <div id="tour-gestion-actions" className="flex gap-2">
                        <DocumentGeneratorDialog
                            leases={filteredLeases}
                            userEmail={user.email}
                            profile={profile}
                        />
                        <AddTenantButton ownerId={user.id} profile={profile} />
                    </div>
                )
            }
        >
            {/* Banner for expired subscription */}
            {proStatus === "expired" ? (
                <ExpiredBanner
                    proStatus={proStatus}
                    propertiesCount={allLeases.length}
                    leasesCount={filteredLeases.length}
                />
            ) : (
                <QuotaBanner
                    tier={currentTier}
                    propertiesCount={advancedStats.totalProperties}
                    leasesCount={advancedStats.activeLeases}
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
            <div id="tour-gestion-table" className="mb-6">
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

            {/* Tutoriel interactif de la page gestion */}
            <GestionTour />

        </ThemedContent>
    );
}
