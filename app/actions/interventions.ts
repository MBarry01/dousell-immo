'use server';

import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { invalidateFinancialCache } from '@/lib/finance-service';

/**
 * Crée une intervention + dépense associée + invalide cache.
 */
export async function createInterventionAction({
    bien_id,
    team_id,
    cost,
    description,
}: {
    bien_id: string;
    team_id: string;
    cost: number;
    description: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    try {
        // 1. Créer l'intervention
        const { data: intervention, error: interventionError } = await supabase
            .from('interventions')
            .insert([
                {
                    bien_id,
                    team_id,
                    status: 'pending',
                    created_by: user.id,
                },
            ])
            .select()
            .single();

        if (interventionError) throw interventionError;

        // 2. Créer la dépense associée
        const { error: expenseError } = await supabase
            .from('expenses')
            .insert([
                {
                    team_id,
                    lease_id: null, // Initialement orphelin ou à lier plus tard
                    amount: cost,
                    description,
                    expense_type: 'maintenance',
                    expense_date: new Date().toISOString(),
                    owner_id: user.id,
                    meta: {
                        source: 'intervention_auto',
                        intervention_id: (intervention as any).id,
                    },
                },
            ]);

        if (expenseError) throw expenseError;

        // 3. Invalider le cache (Realtime hook refetch auto)
        await invalidateFinancialCache(team_id);

        return {
            ok: true,
            intervention,
            message: `✅ Intervention créée. Dépense de ${cost} FCFA enregistrée.`,
        };
    } catch (error) {
        console.error('❌ Erreur création intervention:', error);
        throw error;
    }
}
