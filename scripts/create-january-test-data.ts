/**
 * Script pour créer des données de test pour janvier 2026
 *
 * Ce script crée des échéances de loyer pour janvier 2026 avec le statut "pending"
 * pour que le propriétaire puisse voir les nouvelles échéances dans son tableau de bord.
 *
 * Usage:
 *   npm run create:january-test
 *   ou
 *   npx tsx scripts/create-january-test-data.ts
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

async function createJanuaryTestData() {
    console.log('\n🎯 CRÉATION DE DONNÉES DE TEST - JANVIER 2026\n');

    // 1. Récupérer tous les baux actifs
    const { data: activeLeases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, monthly_amount, owner_id')
        .eq('status', 'active');

    if (leasesError) {
        console.error('❌ Erreur récupération baux:', leasesError.message);
        process.exit(1);
    }

    if (!activeLeases || activeLeases.length === 0) {
        console.error('❌ Aucun bail actif trouvé');
        process.exit(1);
    }

    console.log(`📋 ${activeLeases.length} bail(s) actif(s) trouvé(s):\n`);
    activeLeases.forEach((lease, idx) => {
        console.log(`   ${idx + 1}. ${lease.tenant_name} - ${lease.monthly_amount} FCFA/mois`);
    });

    console.log('\n');

    // 2. Vérifier si des transactions existent déjà pour janvier 2026
    const { data: existingJanuary, error: checkError } = await supabase
        .from('rental_transactions')
        .select('id, lease_id, leases(tenant_name)')
        .eq('period_month', 1)
        .eq('period_year', 2026);

    if (checkError) {
        console.error('❌ Erreur vérification janvier:', checkError.message);
        process.exit(1);
    }

    if (existingJanuary && existingJanuary.length > 0) {
        console.log(`⚠️  ${existingJanuary.length} transaction(s) janvier 2026 existe(nt) déjà:\n`);
        existingJanuary.forEach((trans, idx) => {
            const tenantName = (trans.leases as any)?.tenant_name || 'Inconnu';
            console.log(`   ${idx + 1}. ${tenantName}`);
        });

        // Supprimer les transactions existantes de janvier 2026
        console.log('\n🗑️  Suppression des anciennes transactions de janvier...\n');
        const { error: deleteError } = await supabase
            .from('rental_transactions')
            .delete()
            .eq('period_month', 1)
            .eq('period_year', 2026);

        if (deleteError) {
            console.error('❌ Erreur suppression:', deleteError.message);
            process.exit(1);
        }

        console.log('✅ Anciennes transactions supprimées\n');
    }

    // 3. Créer les nouvelles transactions pour janvier 2026
    console.log('📝 Création des échéances de janvier 2026 (statut: pending)...\n');

    const currentDate = new Date();
    const insertData = activeLeases.map(lease => ({
        lease_id: lease.id,
        period_month: 1,
        period_year: 2026,
        amount_due: lease.monthly_amount,
        status: 'pending',
        created_at: currentDate.toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
        .from('rental_transactions')
        .insert(insertData)
        .select();

    if (insertError) {
        console.error('❌ Erreur création:', insertError.message);
        process.exit(1);
    }

    console.log(`✅ ${inserted?.length || 0} échéance(s) créée(s)\n`);

    // 4. Vérification finale
    const { data: verification, error: verifyError } = await supabase
        .from('rental_transactions')
        .select('id, amount_due, status, leases(tenant_name)')
        .eq('period_month', 1)
        .eq('period_year', 2026)
        .order('created_at', { ascending: true });

    if (verifyError) {
        console.error('❌ Erreur vérification:', verifyError.message);
        process.exit(1);
    }

    console.log('━'.repeat(80));
    console.log('\n✅ DONNÉES DE TEST JANVIER 2026 CRÉÉES:\n');

    verification?.forEach((trans, idx) => {
        const tenantName = (trans.leases as any)?.tenant_name || 'Inconnu';
        console.log(`   ${idx + 1}. ${tenantName.padEnd(25)} | ${String(trans.amount_due).padStart(10)} FCFA | ${trans.status.toUpperCase()}`);
    });

    console.log('\n━'.repeat(80));
    console.log('\n🎉 SUCCÈS! PROCHAINES ÉTAPES:\n');
    console.log('1. 🌐 Allez sur: https://dousell-immo.vercel.app/compte/gestion-locative');
    console.log('2. 👀 Vous verrez les échéances de JANVIER 2026 avec le statut "En attente"');
    console.log('3. ✅ Vous pouvez cliquer "Marqué payé" pour tester le workflow');
    console.log('4. 📊 Ces échéances ont été créées par ce script de test');
    console.log('\n💡 NOTE: Les échéances de DÉCEMBRE 2025 restent intactes (statut: payé)\n');
    console.log('━'.repeat(80));
    console.log('\n');
}

createJanuaryTestData().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
