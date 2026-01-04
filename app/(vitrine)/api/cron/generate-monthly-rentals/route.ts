/**
 * Cron Job: Génération automatique des échéances mensuelles
 *
 * Se déclenche le 1er de chaque mois à 00:01
 * Crée une nouvelle ligne dans rental_transactions pour chaque bail actif
 *
 * Configuration Vercel Cron dans vercel.json
 *
 * Paramètre optionnel: ?date=YYYY-MM-DD pour simuler une date future
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // 1. Vérification de sécurité : Seul Vercel Cron peut appeler cette route
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        console.log('🔓 MODE DÉVELOPPEMENT : Cron exécuté sans authentification');
    } else {
        const authHeader = request.headers.get('authorization');
        const CRON_SECRET = process.env.CRON_SECRET;

        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.error('❌ Tentative d\'accès non autorisée au Cron Job');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    console.log('🚀 CRON JOB DÉMARRÉ - Génération des échéances mensuelles');

    // Utiliser le Service Role Key pour bypasser RLS (pas de session utilisateur dans un Cron)
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
            processed: 0,
            created: 0,
            skipped: 0
        });
    }

    // 3. Date cible : Par défaut = maintenant, ou depuis le paramètre ?date=YYYY-MM-DD
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDate: Date;
    if (dateParam) {
        // Simulation : utiliser la date fournie
        targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
            return NextResponse.json({
                success: false,
                error: 'Format de date invalide. Utilisez YYYY-MM-DD (ex: 2026-01-15)'
            }, { status: 400 });
        }
        console.log(`🧪 MODE SIMULATION - Date cible: ${dateParam}`);
    } else {
        // Production : date actuelle
        targetDate = new Date();
    }

    const currentMonth = targetDate.getMonth() + 1; // 1-12
    const currentYear = targetDate.getFullYear();

    // Calculer period_start (1er du mois) et period_end (dernier jour du mois)
    const periodStart = new Date(currentYear, currentMonth - 1, 1);
    const periodEnd = new Date(currentYear, currentMonth, 0);

    // Formater les dates au format ISO (YYYY-MM-DD) pour Postgres
    const periodStartISO = periodStart.toISOString().split('T')[0];
    const periodEndISO = periodEnd.toISOString().split('T')[0];

    console.log(`📅 Génération pour ${currentMonth}/${currentYear}`);
    console.log(`📆 Période: ${periodStartISO} → ${periodEndISO}`);

    // 4. Pour chaque bail actif, vérifier si l'échéance existe déjà
    const transactionsToCreate = [];
    let skippedCount = 0;

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
            skippedCount++;
            continue;
        }

        // Créer la nouvelle échéance avec les nouveaux champs
        transactionsToCreate.push({
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            period_start: periodStartISO,
            period_end: periodEndISO,
            amount_due: lease.monthly_amount,
            status: 'pending',
            tenant_id: null // NULL car pas de table tenants séparée pour l'instant
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
            processed: activeLeases.length,
            created: insertedTrans.length,
            skipped: skippedCount,
            period: `${currentMonth}/${currentYear}`,
            period_start: periodStartISO,
            period_end: periodEndISO
        });
    }

    return NextResponse.json({
        success: true,
        message: 'Toutes les échéances existent déjà',
        processed: activeLeases.length,
        created: 0,
        skipped: activeLeases.length,
        period: `${currentMonth}/${currentYear}`
    });
}
