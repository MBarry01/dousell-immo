import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import crypto from 'crypto';
import Fuse from 'fuse.js';

export type ResourceType = 'expense' | 'lease' | 'transaction';

export interface ImportRow {
    [key: string]: any;
}

export class ImportService {
    constructor(private supabase: ReturnType<typeof createClient<Database>>) { }

    /**
     * Génère un hash SHA256 unique pour une ligne de données afin d'éviter les doublons.
     */
    generateImportHash(data: ImportRow, teamId: string): string {
        const rawString = JSON.stringify(data) + teamId;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    }

    /**
     * Envoie les données dans la table de staging pour validation.
     */
    async stageData({
        teamId,
        userId,
        resourceType,
        rows
    }: {
        teamId: string;
        userId: string;
        resourceType: ResourceType;
        rows: ImportRow[];
    }) {
        const stagingEntries = rows.map(row => ({
            team_id: teamId,
            imported_by: userId,
            resource_type: resourceType,
            raw_data: row,
            import_hash: this.generateImportHash(row, teamId),
            status: 'pending' as const
        }));

        const { data, error } = await (this.supabase as any)
            .from('imports_staging')
            .upsert(stagingEntries, { onConflict: 'team_id, import_hash' })
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Normalise les données brutes selon le schéma cible.
     * Note: Cette fonction sera enrichie avec la logique de fuzzy matching en Phase 2.
     */
    async standardizeData(id: string) {
        const { data: staged, error: fetchError } = await (this.supabase as any)
            .from('imports_staging')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !staged) throw fetchError || new Error('Not found');

        const raw = (staged as any).raw_data as any;
        let standardized: any = {};

        if ((staged as any).resource_type === 'expense') {
            standardized = {
                amount: parseFloat(raw.montant || raw.amount || 0),
                description: raw.description || raw.libelle || 'Import sans description',
                expense_date: raw.date || new Date().toISOString(),
                category: raw.categorie || raw.category || 'other',
                team_id: (staged as any).team_id,
                meta: {
                    import_source: 'staging',
                    original_data: raw
                }
            };
        }

        const { error: updateError } = await (this.supabase as any)
            .from('imports_staging')
            .update({
                standardized_data: standardized,
                status: 'validated'
            })
            .eq('id', id);

        if (updateError) throw updateError;
    }

    /**
     * Effectue un rapprochement flou (Fuzzy Match) pour trouver le bail ou le bien le plus probable.
     * Thresholds: > 0.95 (Auto-match), > 0.75 (Suggestion)
     */
    async performFuzzyMatch(stagingId: string) {
        const { data: staged, error: fetchError } = await (this.supabase as any)
            .from('imports_staging')
            .select('*')
            .eq('id', stagingId)
            .single();

        if (fetchError || !staged) throw fetchError || new Error('Not found');

        const raw = (staged as any).raw_data as any;
        const searchText = `${raw.description || ''} ${raw.property_name || ''} ${raw.tenant_name || ''}`;

        // 1. Récupérer les baux et biens de l'équipe pour le matching
        const { data: leases } = await this.supabase
            .from('leases')
            .select('id, tenant_name, property_address')
            .eq('team_id', (staged as any).team_id);

        if (!leases || leases.length === 0) return null;

        // 2. Configurer Fuse.js
        const fuse = new Fuse(leases, {
            keys: ['tenant_name', 'property_address'],
            includeScore: true,
            threshold: 0.4 // 1 - 0.4 = 0.6 match minimum pour Fuse (on affinera après)
        });

        const results = fuse.search(searchText);

        if (results.length > 0) {
            const bestMatch = results[0];
            const matchScore = 1 - (bestMatch.score || 1); // Normaliser 0-1

            // 3. Mise à jour avec le meilleur match
            const updateData: any = {
                match_score: matchScore,
                matched_resource_id: bestMatch.item.id
            };

            // Auto-validation si score > 0.95
            if (matchScore > 0.95) {
                updateData.status = 'validated';
                // Mettre à jour standardized_data avec le lease_id matché
                const currentStandardized = (staged as any).standardized_data as any;
                if (currentStandardized) {
                    updateData.standardized_data = {
                        ...currentStandardized,
                        lease_id: bestMatch.item.id
                    };
                }
            }

            await (this.supabase as any)
                .from('imports_staging')
                .update(updateData)
                .eq('id', stagingId);

            return bestMatch;
        }

        return null;
    }

    /**
     * Transfère les données validées du staging vers la production.
     */
    async commitImport(teamId: string, resourceType: ResourceType) {
        const { data: validatedEntries, error: fetchError } = await (this.supabase as any)
            .from('imports_staging')
            .select('*')
            .eq('team_id', teamId)
            .eq('resource_type', resourceType)
            .eq('status', 'validated');

        if (fetchError) throw fetchError;
        if (!validatedEntries || validatedEntries.length === 0) return { count: 0 };

        const table = resourceType === 'expense' ? 'expenses' :
            resourceType === 'lease' ? 'leases' : 'rental_transactions';

        const productionData = validatedEntries.map((e: any) => e.standardized_data);

        // Insertion atomique en production
        const { error: insertError } = await this.supabase
            .from(table as any)
            .insert(productionData);

        if (insertError) throw insertError;

        // Marquer comme 'committed'
        const { error: finalizeError } = await (this.supabase as any)
            .from('imports_staging')
            .update({ status: 'committed' })
            .in('id', validatedEntries.map((e: any) => e.id));

        if (finalizeError) throw finalizeError;

        return { count: validatedEntries.length };
    }

    /**
     * Action manuelle : Lie une dépense orpheline à un bail spécifique.
     * Ajoute une trace dans les metadata.
     */
    async linkExpenseToLease(expenseId: string, leaseId: string, userId: string) {
        // 1. Récupérer les infos du bail pour le team_id
        const { data: lease, error: leaseError } = await this.supabase
            .from('leases')
            .select('team_id')
            .eq('id', leaseId)
            .single();

        if (leaseError || !lease) throw leaseError || new Error('Lease not found');

        // 2. Mettre à jour la dépense
        const { data: expense, error: fetchError } = await (this.supabase as any)
            .from('expenses')
            .select('meta')
            .eq('id', expenseId)
            .single();

        if (fetchError) throw fetchError;

        const currentMeta = ((expense as any)?.meta as any) || {};
        const correction = {
            type: 'manual_link',
            lease_id: leaseId,
            user_id: userId,
            timestamp: new Date().toISOString()
        };

        const newMeta = {
            ...currentMeta,
            user_corrections: [...(currentMeta.user_corrections || []), correction]
        };

        const { error: updateError } = await this.supabase
            .from('expenses')
            .update({
                lease_id: leaseId,
                team_id: lease.team_id,
                meta: newMeta
            })
            .eq('id', expenseId);

        if (updateError) throw updateError;
        return { success: true };
    }
}
