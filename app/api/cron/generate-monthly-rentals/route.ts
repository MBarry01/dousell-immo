/**
 * Cron Job: Génération automatique des échéances mensuelles
 *
 * Se déclenche le 1er de chaque mois à 00:01
 * Crée une nouvelle ligne dans rental_transactions pour chaque bail actif
 *
 * Configuration Vercel Cron dans vercel.json
 */

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // 1. Vérification de sécurité : Seul Vercel Cron peut appeler cette route
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.error('❌ Tentative d\'accès non autorisée au Cron Job');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 CRON JOB DÉMARRÉ - Génération des échéances mensuelles');

    const supabase = await createClient();

    // 2. Récupérer tous les baux actifs
    const { data: activeLeases, error: leasesError } = await supabase
        .from('leases')
        .select('id, owner_id, monthly_amount, tenant_name')
        .eq('status', 'active');

    if (leasesError) {
        console.error('❌ Erreur récupération baux actifs:', leasesError.message);
        return NextResponse.json({
            success: false,
            error: leasesError.message
        }, { status: 500 });
    }

    if (!activeLeases || activeLeases.length === 0) {
        console.log('ℹ️ Aucun bail actif trouvé');
        return NextResponse.json({
            success: true,
            message: 'Aucun bail actif',
            created: 0
        });
    }

    // 3. Date du mois en cours
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`📅 Génération pour ${currentMonth}/${currentYear}`);

    // 4. Pour chaque bail actif, vérifier si l'échéance existe déjà
    const transactionsToCreate = [];

    for (const lease of activeLeases) {
        // Vérifier si une transaction existe déjà pour ce mois
        const { data: existingTrans } = await supabase
            .from('rental_transactions')
            .select('id')
            .eq('lease_id', lease.id)
            .eq('period_month', currentMonth)
            .eq('period_year', currentYear)
            .maybeSingle();

        if (existingTrans) {
            console.log(`⏭️  Échéance déjà existante pour ${lease.tenant_name}`);
            continue;
        }

        // Créer la nouvelle échéance
        transactionsToCreate.push({
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            amount_due: lease.monthly_amount,
            status: 'pending'
        });
    }

    // 5. Insertion en masse
    if (transactionsToCreate.length > 0) {
        const { data: insertedTrans, error: insertError } = await supabase
            .from('rental_transactions')
            .insert(transactionsToCreate)
            .select();

        if (insertError) {
            console.error('❌ Erreur insertion échéances:', insertError.message);
            return NextResponse.json({
                success: false,
                error: insertError.message
            }, { status: 500 });
        }

        console.log(`✅ ${insertedTrans.length} échéances créées avec succès`);

        return NextResponse.json({
            success: true,
            message: `${insertedTrans.length} échéances générées`,
            created: insertedTrans.length,
            period: `${currentMonth}/${currentYear}`
        });
    }

    return NextResponse.json({
        success: true,
        message: 'Toutes les échéances existent déjà',
        created: 0
    });
}
