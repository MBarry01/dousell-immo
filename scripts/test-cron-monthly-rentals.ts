/**
 * Script de test pour simuler le Cron Job de génération d'échéances
 *
 * Usage:
 *   npm run test:cron-rentals
 *   ou
 *   npx tsx scripts/test-cron-monthly-rentals.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCronJob() {
    console.log('🚀 TEST DU CRON JOB - Génération des échéances mensuelles\n');

    // 1. Récupérer tous les baux actifs
    const { data: activeLeases, error: leasesError } = await supabase
        .from('leases')
        .select('id, owner_id, monthly_amount, tenant_name')
        .eq('status', 'active');

    if (leasesError) {
        console.error('❌ Erreur récupération baux actifs:', leasesError.message);
        process.exit(1);
    }

    if (!activeLeases || activeLeases.length === 0) {
        console.log('ℹ️  Aucun bail actif trouvé');
        process.exit(0);
    }

    console.log(`📋 ${activeLeases.length} bail(s) actif(s) trouvé(s)\n`);

    // 2. Date du mois en cours
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`📅 Génération pour ${currentMonth}/${currentYear}\n`);

    // 3. Pour chaque bail actif, vérifier si l'échéance existe déjà
    const transactionsToCreate = [];
    let skipped = 0;

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
            console.log(`⏭️  [${lease.tenant_name}] Échéance déjà existante`);
            skipped++;
            continue;
        }

        console.log(`➕ [${lease.tenant_name}] Nouvelle échéance à créer (${lease.monthly_amount} FCFA)`);

        // Créer la nouvelle échéance
        transactionsToCreate.push({
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            amount_due: lease.monthly_amount,
            status: 'pending'
        });
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   - Échéances existantes: ${skipped}`);
    console.log(`   - Échéances à créer: ${transactionsToCreate.length}`);

    // 4. Insertion en masse
    if (transactionsToCreate.length > 0) {
        const { data: insertedTrans, error: insertError } = await supabase
            .from('rental_transactions')
            .insert(transactionsToCreate)
            .select();

        if (insertError) {
            console.error('\n❌ Erreur insertion échéances:', insertError.message);
            process.exit(1);
        }

        console.log(`\n✅ ${insertedTrans.length} échéance(s) créée(s) avec succès\n`);

        // Afficher les détails
        console.log('📝 Détails des échéances créées:');
        insertedTrans.forEach((trans, index) => {
            console.log(`   ${index + 1}. Transaction ID: ${trans.id}`);
            console.log(`      - Montant: ${trans.amount_due} FCFA`);
            console.log(`      - Période: ${trans.period_month}/${trans.period_year}`);
            console.log(`      - Statut: ${trans.status}`);
        });
    } else {
        console.log('\n✅ Toutes les échéances existent déjà\n');
    }

    console.log('\n✅ Test terminé avec succès\n');
}

// Exécuter le test
testCronJob().catch((error) => {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
});
