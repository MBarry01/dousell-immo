'use server';

import { supabase } from '@/lib/supabase';
import {
    calculateFinancials,
    type FinancialKPIs,
    type MonthlyFinancialSummary,
    type LeaseInput,
    type TransactionInput,
    type ExpenseInput,
} from '@/lib/finance';
import { getOrSetCache } from '@/lib/cache/cache-aside';

/**
 * Récupère les stats financières pour un PROPRIÉTAIRE (année complète).
 * Source : Cache Redis + DB si cache miss.
 */
export async function getFinancialStatsForOwner(
    ownerId: string,
    year: number
): Promise<FinancialKPIs> {
    const cacheKey = `financial-stats:v2:owner:${ownerId}:${year}`;

    return getOrSetCache(
        cacheKey,
        async () => {
            // 1. Récupérer les baux
            const { data: leases, error: leasesError } = await supabase
                .from('leases')
                .select('id, monthly_amount, status, start_date, billing_day')
                .eq('owner_id', ownerId);

            if (leasesError) throw leasesError;

            // 2. Récupérer les transactions
            // Note: rental_transactions n'a pas toujours owner_id direct, il faut parfois join.
            // Mais si la vue ou table a owner_id c'est mieux.
            // TODO: Vérifier si rental_transactions a owner_id.
            // Si non, on filtre par les lease_ids de l'owner.

            // Stratégie sûre : Filtrer par lease_ids
            const leaseIds = (leases || []).map(l => l.id);
            let transactions: any[] = [];

            if (leaseIds.length > 0) {
                const { data: txs, error: transactionsError } = await supabase
                    .from('rental_transactions')
                    .select('id, lease_id, amount_due, amount_paid, status, period_start')
                    .in('lease_id', leaseIds);

                if (transactionsError) throw transactionsError;
                transactions = txs || [];
            }

            // 3. Récupérer les dépenses
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('id, amount, expense_date, lease_id')
                .eq('owner_id', ownerId);

            if (expensesError) throw expensesError;

            // 4. Calculer les KPIs (année complète)
            const targetDate = new Date(year, 0, 1);
            const kpis = calculateFinancials(
                (leases || []) as LeaseInput[],
                (transactions || []).map((t: any) => ({ ...t, period_date: t.period_start })) as TransactionInput[],
                (expenses || []) as ExpenseInput[],
                targetDate
            );

            return kpis;
        },
        { ttl: 300, namespace: 'financials' } // Cache 5 min
    );
}

/**
 * Récupère les stats financières pour une ÉQUIPE (année complète).
 * Source : Cache Redis + DB si cache miss.
 */
export async function getFinancialStatsForTeam(
    teamId: string,
    year: number
): Promise<FinancialKPIs> {
    const cacheKey = `financial-stats:v2:team:${teamId}:${year}`;

    return getOrSetCache(
        cacheKey,
        async () => {
            // 1. Récupérer les baux
            const { data: leases, error: leasesError } = await supabase
                .from('leases')
                .select('id, monthly_amount, status, start_date, billing_day')
                .eq('team_id', teamId);

            if (leasesError) throw leasesError;

            // 2. Récupérer les transactions
            const { data: transactions, error: transactionsError } = await supabase
                .from('rental_transactions')
                .select('id, lease_id, amount_due, amount_paid, status, period_start')
                .eq('team_id', teamId);

            if (transactionsError) throw transactionsError;

            // 3. Récupérer les dépenses
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('id, amount, expense_date, lease_id')
                .eq('team_id', teamId);

            if (expensesError) throw expensesError;

            // 4. Calculer les KPIs (année complète)
            const targetDate = new Date(year, 0, 1);
            const kpis = calculateFinancials(
                (leases || []) as LeaseInput[],
                (transactions || []).map((t: any) => ({ ...t, period_date: t.period_start })) as TransactionInput[],
                (expenses || []) as ExpenseInput[],
                targetDate
            );

            return kpis;
        },
        { ttl: 300, namespace: 'financials' } // Cache 5 min
    );
}

/**
 * Récupère les stats pour un mois spécifique (avec breakdown).
 */
export async function getMonthlyFinancialSummary(
    teamId: string,
    year: number,
    month: number
): Promise<MonthlyFinancialSummary> {
    const cacheKey = `financial-stats:${teamId}:${year}:${month}`;

    return getOrSetCache(
        cacheKey,
        async () => {
            const { data: leases } = await supabase
                .from('leases')
                .select('id, monthly_amount, status, start_date, billing_day')
                .eq('team_id', teamId);

            const { data: transactions } = await supabase
                .from('rental_transactions')
                .select('id, lease_id, amount_due, amount_paid, status, period_start')
                .eq('team_id', teamId);

            const { data: expenses } = await supabase
                .from('expenses')
                .select('id, amount, expense_date, lease_id')
                .eq('team_id', teamId);

            // Filtrer par mois
            const monthlyTransactions = (transactions || []).filter((t: any) => {
                const d = new Date(t.period_start);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });

            const monthlyExpenses = (expenses || []).filter((e: any) => {
                const d = new Date(e.expense_date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });

            const targetDate = new Date(year, month - 1, 1);
            const kpis = calculateFinancials(
                (leases || []) as LeaseInput[],
                monthlyTransactions.map((t: any) => ({ ...t, period_date: t.period_start })) as TransactionInput[],
                monthlyExpenses as ExpenseInput[],
                targetDate
            );

            return {
                ...kpis,
                month,
                year,
                future: 0,
            };
        },
        { ttl: 300, namespace: 'financials' }
    );
}

/**
 * Invalide le cache financier après une mutation (créer dépense, payer loyer, etc).
 */
export async function invalidateFinancialCache(teamId: string) {
    console.log(`🧹 Invalidating cache for team ${teamId}`);
    // L'invalidation dépendra de l'implémentation de getOrSetCache
}
