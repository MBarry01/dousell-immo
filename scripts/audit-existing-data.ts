import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function audit(teamId?: string) {
    console.log(`🔍 Démarrage de l'audit financier... ${teamId ? `(Équipe: ${teamId})` : "(Toutes les équipes)"}`);

    const report: any = {
        timestamp: new Date().toISOString(),
        team_id: teamId || "all",
        readyForMigration: true,
        recommendations: [],
    };

    try {
        // 1. Comptage global
        const qProps = supabase.from("properties").select("*", { count: "exact", head: true });
        const qLeases = supabase.from("leases").select("*", { count: "exact", head: true });
        const qExpenses = supabase.from("expenses").select("*", { count: "exact", head: true });
        const qTrans = supabase.from("rental_transactions").select("*", { count: "exact", head: true });

        if (teamId) {
            qProps.eq("team_id", teamId);
            qLeases.eq("team_id", teamId);
            // Expenses & Transactions don't have team_id yet (that's why we audit!)
            // But we can filter by owner_id if we have it from team_members
            const { data: members } = await supabase.from("team_members").select("user_id").eq("team_id", teamId);
            const userIds = members?.map(m => m.user_id) || [];
            qExpenses.in("owner_id", userIds);
            // rental_transactions doesn't have owner_id directly, usually linked via lease
        }

        const [rProps, rLeases, rExpenses, rTrans] = await Promise.all([qProps, qLeases, qExpenses, qTrans]);

        report.propertiesCount = rProps.count || 0;
        report.leasesCount = rLeases.count || 0;
        report.expensesCount = rExpenses.count || 0;
        report.transactionsCount = rTrans.count || 0;

        // 2. Détection des orphelins (Dépenses sans lease_id)
        const qOrphans = supabase.from("expenses").select("id, amount, description, created_at, owner_id").is("lease_id", null);
        if (teamId) {
            const { data: members } = await supabase.from("team_members").select("user_id").eq("team_id", teamId);
            const userIds = members?.map(m => m.user_id) || [];
            qOrphans.in("owner_id", userIds);
        }
        const { data: orphans } = await qOrphans;

        report.orphanExpenses = {
            count: orphans?.length || 0,
            details: orphans || [],
        };

        if (report.orphanExpenses.count > 0) {
            report.recommendations.push(`⚠️ ${report.orphanExpenses.count} dépenses orphelines détectées (à lier ou envoyer en Caisse Générale).`);
        }

        // 3. Détection des devises mixtes
        // On va scanner les baux pour voir les devises
        const { data: currencies } = await supabase.from("leases").select("currency");
        const mix: Record<string, number> = {};
        currencies?.forEach(l => {
            const c = l.currency || "FCFA";
            mix[c] = (mix[c] || 0) + 1;
        });
        report.currencyMix = mix;

        const currencyTypes = Object.keys(mix);
        if (currencyTypes.length > 1) {
            report.recommendations.push(`ℹ️ Devises mixtes détectées (${currencyTypes.join(", ")}). Conversion nécessaire lors de la migration.`);
        }

        // 4. Détection des mois déficitaires (Cashflow vs Performance)
        // On analyse les 6 derniers mois
        const now = new Date();
        const interval = eachMonthOfInterval({
            start: subMonths(now, 5),
            end: now
        });

        const deficitMonths = [];

        for (const monthDate of interval) {
            const start = startOfMonth(monthDate).toISOString();
            const end = endOfMonth(monthDate).toISOString();
            const monthLabel = format(monthDate, "yyyy-MM");

            // Actual Profit (Cashflow): Somme des transactions 'paid' ce mois-ci
            // Note: rental_transactions a period_month/period_year
            const m = monthDate.getMonth() + 1;
            const y = monthDate.getFullYear();

            const { data: paidTrans } = await supabase
                .from("rental_transactions")
                .select("amount_due") // Fallback on due if paid amount not clear
                .eq("status", "paid")
                .eq("period_month", m)
                .eq("period_year", y);

            const actualRevenue = paidTrans?.reduce((sum, t) => sum + (t.amount_due || 0), 0) || 0;

            // Projected Profit: Somme des monthly_amount de baux actifs
            const { data: activeLeases } = await supabase
                .from("leases")
                .select("monthly_amount")
                .eq("status", "active")
                .lte("start_date", end);
            // .or(`end_date.is.null,end_date.gte.${start}`); // Simplified filter for audit

            const projectedRevenue = activeLeases?.reduce((sum, l) => sum + (l.monthly_amount || 0), 0) || 0;

            // Dépenses du mois
            const { data: monthExpenses } = await supabase
                .from("expenses")
                .select("amount")
                .gte("expense_date", start)
                .lte("expense_date", end);

            const actualExpenses = monthExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

            const actualProfit = actualRevenue - actualExpenses;
            const projectedProfit = projectedRevenue - actualExpenses;

            if (actualProfit < 0) {
                deficitMonths.push({
                    month: monthLabel,
                    actualProfit,
                    projectedProfit,
                    isTemporaryDebt: projectedProfit > 0 && actualProfit < 0
                });
            }
        }

        report.deficitMonths = deficitMonths;
        if (deficitMonths.some(m => m.isTemporaryDebt)) {
            report.recommendations.push(`✅ Dettes temporaires détectées : loyers en attente couvrant les dépenses.`);
        }

        console.log("\n📊 RAPPORT D'AUDIT FINANCIER");
        console.log("===========================");
        console.log(JSON.stringify(report, null, 2));
        console.log("===========================\n");

    } catch (err) {
        console.error("❌ Erreur lors de l'audit:", err);
        report.readyForMigration = false;
    }
}

// Récupérer le teamId depuis les arguments
const args = process.argv.slice(2);
const teamIdArg = args.find(a => a.startsWith("--team-id="))?.split("=")[1];

audit(teamIdArg);
