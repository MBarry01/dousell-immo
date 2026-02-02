'use client';

import { useState, useCallback } from 'react';
import type { FinancialKPIs } from '@/lib/finance';

/**
 * Hook pour les Optimistic Updates : 
 * Affiche le changement immédiatement en UI, rollback si erreur serveur.
 */
export function useOptimisticUpdate(initialStats: FinancialKPIs | null) {
    const [optimistic, setOptimistic] = useState<FinancialKPIs | null>(initialStats);

    // Réinitialiser si les stats changent (refetch)
    const updateOptimistic = useCallback((updates: Partial<FinancialKPIs>) => {
        setOptimistic((prev) =>
            prev ? { ...prev, ...updates } : null
        );
    }, []);

    // Fonction pour rollback (en cas d'erreur serveur)
    const rollback = useCallback(() => {
        setOptimistic(initialStats);
    }, [initialStats]);

    // Fonction pour commiter les changements
    const commit = useCallback(() => {
        // Les changements optimistic deviennent "réels" une fois que le serveur répond
        // Aucune action nécessaire (le Realtime hook va refetch de toute façon)
    }, []);

    return {
        optimistic,
        updateOptimistic,
        rollback,
        commit,
    };
}
