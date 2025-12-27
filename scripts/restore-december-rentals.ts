/**
 * Script pour RESTAURER les échéances de décembre supprimées par erreur
 *
 * Ce script recrée les 5 transactions de décembre 2025 qui ont été supprimées
 * avec leur statut "paid" d'origine.
 *
 * Usage:
 *   npm run restore:december-rentals
 *   ou
 *   npx tsx scripts/restore-december-rentals.ts
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

async function restoreDecemberRentals() {
    console.log('\n🔧 RESTAURATION DES ÉCHÉANCES DE DÉCEMBRE 2025\n');

    // 1. Récupérer tous les baux pour identifier les lease_id corrects
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, owner_id, monthly_amount')
        .eq('status', 'active');

    if (leasesError) {
        console.error('❌ Erreur récupération baux:', leasesError.message);
        process.exit(1);
    }

    if (!leases || leases.length === 0) {
        console.error('❌ Aucun bail actif trouvé');
        process.exit(1);
    }

    console.log(`📋 ${leases.length} bail(s) actif(s) trouvé(s):\n`);
    leases.forEach((lease, idx) => {
        console.log(`   ${idx + 1}. ${lease.tenant_name} (ID: ${lease.id})`);
    });

    // 2. Mapper les noms de locataires aux lease_id
    const mohamadouLease = leases.find(l => l.tenant_name === 'Mohamadou Barry');
    const barryLease = leases.find(l => l.tenant_name === 'Barry BARRY');
    const sambaLease = leases.find(l => l.tenant_name === 'Samba Barry');

    if (!mohamadouLease || !barryLease || !sambaLease) {
        console.error('\n❌ Impossible de trouver tous les locataires nécessaires');
        console.error('Requis: Mohamadou Barry, Barry BARRY, Samba Barry');
        process.exit(1);
    }

    // 3. Préparer les transactions à restaurer
    const transactionsToRestore = [
        {
            lease_id: mohamadouLease.id,
            owner_id: mohamadouLease.owner_id,
            amount_due: 10000,
            tenant_name: 'Mohamadou Barry',
        },
        {
            lease_id: mohamadouLease.id,
            owner_id: mohamadouLease.owner_id,
            amount_due: 100000,
            tenant_name: 'Mohamadou Barry',
        },
        {
            lease_id: barryLease.id,
            owner_id: barryLease.owner_id,
            amount_due: 50000,
            tenant_name: 'Barry BARRY',
        },
        {
            lease_id: sambaLease.id,
            owner_id: sambaLease.owner_id,
            amount_due: 150000,
            tenant_name: 'Samba Barry',
        },
        {
            lease_id: mohamadouLease.id,
            owner_id: mohamadouLease.owner_id,
            amount_due: 20000,
            tenant_name: 'Mohamadou Barry',
        },
    ];

    console.log('\n📝 Transactions à restaurer:\n');
    transactionsToRestore.forEach((trans, idx) => {
        console.log(`   ${idx + 1}. ${trans.tenant_name} - ${trans.amount_due} FCFA (payé)`);
    });

    console.log('\n🔄 Restauration en cours...\n');

    // 4. Insérer les transactions restaurées
    const currentDate = new Date();
    const insertData = transactionsToRestore.map(trans => ({
        lease_id: trans.lease_id,
        period_month: 12,
        period_year: 2025,
        amount_due: trans.amount_due,
        status: 'paid',
        paid_at: currentDate.toISOString(),
        created_at: currentDate.toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
        .from('rental_transactions')
        .insert(insertData)
        .select();

    if (insertError) {
        console.error('❌ Erreur insertion:', insertError.message);
        process.exit(1);
    }

    console.log(`✅ ${inserted?.length || 0} transaction(s) restaurée(s)\n`);

    // 5. Vérification
    const { data: verification, error: verifyError } = await supabase
        .from('rental_transactions')
        .select('id, amount_due, status, leases(tenant_name)')
        .eq('period_month', 12)
        .eq('period_year', 2025);

    if (verifyError) {
        console.error('❌ Erreur vérification:', verifyError.message);
        process.exit(1);
    }

    console.log('━'.repeat(80));
    console.log('\n✅ VÉRIFICATION DES TRANSACTIONS RESTAURÉES:\n');

    verification?.forEach((trans, idx) => {
        const tenantName = (trans.leases as { tenant_name?: string })?.tenant_name || 'Inconnu';
        console.log(`   ${idx + 1}. ${tenantName} - ${trans.amount_due} FCFA (${trans.status})`);
    });

    console.log('\n━'.repeat(80));
    console.log('\n🎉 RESTAURATION TERMINÉE AVEC SUCCÈS!\n');
    console.log('Les échéances de décembre 2025 ont été restaurées avec leur statut "payé".\n');
}

restoreDecemberRentals().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
