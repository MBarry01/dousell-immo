/**
 * Script pour supprimer les données de test de janvier 2026
 *
 * Ce script supprime toutes les échéances de janvier 2026 qui ont été créées
 * pour les tests, en gardant uniquement les données de production (décembre 2025).
 *
 * Usage:
 *   npm run clean:test-data
 *   ou
 *   npx tsx scripts/clean-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestData() {
    console.log('\n🧹 NETTOYAGE DES DONNÉES DE TEST\n');

    // Vérifier les transactions de janvier 2026 (données de test)
    const { data: januaryTransactions, error: fetchError } = await supabase
        .from('rental_transactions')
        .select('id, amount_due, status, leases(tenant_name)')
        .eq('period_month', 1)
        .eq('period_year', 2026);

    if (fetchError) {
        console.error('❌ Erreur récupération transactions:', fetchError.message);
        process.exit(1);
    }

    if (!januaryTransactions || januaryTransactions.length === 0) {
        console.log('✅ Aucune donnée de test à supprimer (janvier 2026)\n');
        return;
    }

    console.log(`📋 ${januaryTransactions.length} transaction(s) de test trouvée(s) (janvier 2026):\n`);

    januaryTransactions.forEach((trans, index) => {
        const tenantName = (trans.leases as { tenant_name?: string })?.tenant_name || 'Inconnu';
        console.log(`   ${index + 1}. ${tenantName} - ${trans.amount_due} FCFA (${trans.status})`);
    });

    console.log('\n🗑️  Suppression des données de test...\n');

    // Supprimer les transactions de janvier 2026
    const { error: deleteError } = await supabase
        .from('rental_transactions')
        .delete()
        .eq('period_month', 1)
        .eq('period_year', 2026);

    if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError.message);
        process.exit(1);
    }

    console.log(`✅ ${januaryTransactions.length} transaction(s) de test supprimée(s)\n`);

    // Vérification finale
    const { data: remainingData } = await supabase
        .from('rental_transactions')
        .select('period_month, period_year, status, leases(tenant_name)')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .limit(10);

    console.log('━'.repeat(80));
    console.log('\n📊 TRANSACTIONS RESTANTES (10 plus récentes):\n');

    if (remainingData && remainingData.length > 0) {
        remainingData.forEach((trans, idx) => {
            const tenantName = (trans.leases as { tenant_name?: string })?.tenant_name || 'Inconnu';
            const period = `${trans.period_month.toString().padStart(2, '0')}/${trans.period_year}`;
            console.log(`   ${idx + 1}. ${tenantName.padEnd(25)} | ${period} | ${trans.status.toUpperCase()}`);
        });
    } else {
        console.log('   Aucune transaction');
    }

    console.log('\n━'.repeat(80));
    console.log('\n✨ NETTOYAGE TERMINÉ!\n');
    console.log('Les données de test de janvier 2026 ont été supprimées.');
    console.log('Les données de production (décembre 2025) sont conservées.\n');
}

cleanTestData().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
