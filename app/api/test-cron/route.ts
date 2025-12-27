/**
 * Route API de test pour simuler la génération automatique des échéances
 *
 * Cette route permet de tester manuellement la création d'échéances pour janvier 2026
 * sans attendre le Cron Job automatique.
 *
 * Usage: GET /api/test-cron
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Utiliser le Service Role Key pour bypasser RLS (même logique que le Cron)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const targetMonth = 1; // Janvier
        const targetYear = 2026;

        console.log(`🧪 TEST CRON - Génération échéances pour ${targetMonth}/${targetYear}`);

        // 1. Récupérer tous les baux actifs
        const { data: activeLeases, error: leasesError } = await supabase
            .from('leases')
            .select('id, tenant_name, monthly_amount, owner_id')
            .eq('status', 'active');

        if (leasesError) {
            console.error('❌ Erreur récupération baux:', leasesError);
            return NextResponse.json(
                { error: 'Erreur récupération baux', details: leasesError.message },
                { status: 500 }
            );
        }

        if (!activeLeases || activeLeases.length === 0) {
            return NextResponse.json({
                message: 'Aucun bail actif trouvé',
                created: 0,
                skipped: 0
            });
        }

        console.log(`📋 ${activeLeases.length} bail(s) actif(s) trouvé(s)`);

        // 2. Vérifier quelles échéances existent déjà pour janvier 2026
        const { data: existingTransactions, error: existingError } = await supabase
            .from('rental_transactions')
            .select('lease_id')
            .eq('period_month', targetMonth)
            .eq('period_year', targetYear);

        if (existingError) {
            console.error('❌ Erreur vérification transactions:', existingError);
            return NextResponse.json(
                { error: 'Erreur vérification transactions', details: existingError.message },
                { status: 500 }
            );
        }

        const existingLeaseIds = new Set(existingTransactions?.map(t => t.lease_id) || []);
        console.log(`🔍 ${existingLeaseIds.size} échéance(s) existante(s) pour ${targetMonth}/${targetYear}`);

        // 3. Créer les échéances manquantes
        const newTransactions = activeLeases
            .filter(lease => !existingLeaseIds.has(lease.id))
            .map(lease => ({
                lease_id: lease.id,
                period_month: targetMonth,
                period_year: targetYear,
                amount_due: lease.monthly_amount,
                status: 'pending',
                created_at: new Date().toISOString()
            }));

        let created = 0;
        if (newTransactions.length > 0) {
            const { data: inserted, error: insertError } = await supabase
                .from('rental_transactions')
                .insert(newTransactions)
                .select();

            if (insertError) {
                console.error('❌ Erreur insertion:', insertError);
                return NextResponse.json(
                    { error: 'Erreur insertion transactions', details: insertError.message },
                    { status: 500 }
                );
            }

            created = inserted?.length || 0;
            console.log(`✅ ${created} échéance(s) créée(s)`);
        }

        const skipped = activeLeases.length - created;

        // 4. Log détaillé pour debug
        const summary = {
            message: 'Test Cron exécuté avec succès',
            period: `${targetMonth}/${targetYear}`,
            totalLeases: activeLeases.length,
            created,
            skipped,
            details: activeLeases.map(lease => ({
                tenant: lease.tenant_name,
                amount: lease.monthly_amount,
                created: !existingLeaseIds.has(lease.id)
            }))
        };

        console.log('📊 Résumé:', summary);

        return NextResponse.json(summary);

    } catch (error) {
        console.error('❌ Erreur test-cron:', error);
        return NextResponse.json(
            { error: 'Erreur interne', details: (error as Error).message },
            { status: 500 }
        );
    }
}
