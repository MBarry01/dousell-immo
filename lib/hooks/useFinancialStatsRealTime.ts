'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import type { FinancialKPIs, MonthlyFinancialSummary } from '@/lib/finance';
import { getFinancialStatsForTeam, getMonthlyFinancialSummary } from '@/lib/finance-service';

interface UseFinancialStatsOptions {
    teamId: string;
    year?: number;
    month?: number;
    enabled?: boolean;
}

/**
 * Hook Real-Time : S'abonne aux changements de dépenses et transactions.
 * Invalide automatiquement le cache React Query et refetch les données.
 */
export function useFinancialStatsRealTime({
    teamId,
    year = new Date().getFullYear(),
    month,
    enabled = true,
}: UseFinancialStatsOptions) {
    const [stats, setStats] = useState<FinancialKPIs | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyFinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // 1. Fonction de refetch
    const fetchStats = useCallback(async () => {
        if (!enabled || !teamId) return;

        try {
            setLoading(true);
            setError(null);

            // Récupérer les stats globales
            const yearlyStats = await getFinancialStatsForTeam(teamId, year);
            setStats(yearlyStats);

            // Si un mois est spécifié, récupérer les stats mensuelles
            if (month) {
                const monthStats = await getMonthlyFinancialSummary(teamId, year, month);
                setMonthlyStats(monthStats);
            }
        } catch (err) {
            console.error('❌ Erreur fetching financial stats:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [teamId, year, month, enabled]);

    // 2. Charger les données au montage
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // 3. S'abonner aux changements Realtime (CRITICAL)
    useEffect(() => {
        if (!enabled || !teamId) return;

        console.log(`🔄 S'abonnant aux changements pour team: ${teamId}`);

        // Canal 1 : Changements dans expenses
        const expensesChannel = supabase
            .channel(`expenses:team_id=eq.${teamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'expenses',
                    filter: `team_id=eq.${teamId}`,
                },
                (payload) => {
                    console.log('📊 Expense changée:', payload);
                    // Invalider le cache React Query
                    queryClient.invalidateQueries({
                        queryKey: ['financialStats', teamId, year],
                    });
                    // Refetch immédiatement
                    fetchStats();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Abonnement expenses établi');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Erreur subscription expenses');
                }
            });

        // Canal 2 : Changements dans rental_transactions
        const transactionsChannel = supabase
            .channel(`rental_transactions:team_id=eq.${teamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rental_transactions',
                    filter: `team_id=eq.${teamId}`,
                },
                (payload) => {
                    console.log('📊 Transaction changée:', payload);
                    queryClient.invalidateQueries({
                        queryKey: ['financialStats', teamId, year],
                    });
                    fetchStats();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Abonnement transactions établi');
                }
            });

        // Canal 3 : Changements dans leases (statut, montant)
        const leasesChannel = supabase
            .channel(`leases:team_id=eq.${teamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leases',
                    filter: `team_id=eq.${teamId}`,
                },
                (payload) => {
                    console.log('📊 Lease changé:', payload);
                    queryClient.invalidateQueries({
                        queryKey: ['financialStats', teamId, year],
                    });
                    fetchStats();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Abonnement leases établi');
                }
            });

        // 4. Cleanup : Unsubscribe au unmount
        return () => {
            console.log('🔌 Unsubscribing from channels');
            supabase.removeChannel(expensesChannel);
            supabase.removeChannel(transactionsChannel);
            supabase.removeChannel(leasesChannel);
        };
    }, [teamId, year, enabled, queryClient, fetchStats]);

    return {
        stats,
        monthlyStats,
        loading,
        error,
        refetch: fetchStats,
    };
}
