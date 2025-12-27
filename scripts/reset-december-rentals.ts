/**
 * Script pour réinitialiser les échéances de décembre
 * Permet de tester la création automatique en conditions réelles
 *
 * Usage:
 *   npm run reset:december-rentals
 *   ou
 *   npx tsx scripts/reset-december-rentals.ts
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

async function resetDecemberRentals() {
    console.log('\n🔄 RÉINITIALISATION DES ÉCHÉANCES DE DÉCEMBRE 2025\n');

    const currentMonth = 12;
    const currentYear = 2025;

    // 1. Récupérer les transactions de décembre
    const { data: decemberTransactions, error: fetchError } = await supabase
        .from('rental_transactions')
        .select('id, lease_id, amount_due, status, leases(tenant_name)')
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

    if (fetchError) {
        console.error('❌ Erreur récupération transactions:', fetchError.message);
        process.exit(1);
    }

    if (!decemberTransactions || decemberTransactions.length === 0) {
        console.log('ℹ️  Aucune transaction de décembre trouvée\n');
        return;
    }

    console.log(`📋 ${decemberTransactions.length} transaction(s) de décembre trouvée(s):\n`);

    decemberTransactions.forEach((trans, index) => {
        const tenantName = (trans.leases as { tenant_name?: string })?.tenant_name || 'Inconnu';
        console.log(`   ${index + 1}. ${tenantName} - ${trans.amount_due} FCFA (${trans.status})`);
    });

    console.log('\n⚠️  Ces transactions vont être SUPPRIMÉES pour permettre le test de création automatique\n');

    // Demander confirmation
    console.log('Suppression en cours...\n');

    // 2. Supprimer les transactions de décembre
    const { error: deleteError } = await supabase
        .from('rental_transactions')
        .delete()
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

    if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError.message);
        process.exit(1);
    }

    console.log(`✅ ${decemberTransactions.length} transaction(s) supprimée(s)\n`);
    console.log('━'.repeat(80));
    console.log('\n🎬 PROCHAINES ÉTAPES :\n');
    console.log('1. Allez sur Vercel → Settings → Cron Jobs');
    console.log('2. Cliquez sur le bouton "Run" pour déclencher le Cron manuellement');
    console.log('3. Attendez 5-10 secondes');
    console.log('4. Allez sur votre tableau de bord : https://dousell-immo.vercel.app/compte/gestion-locative');
    console.log('5. Vous verrez les nouvelles échéances avec le statut "Impayé" ou "En attente"\n');
    console.log('━'.repeat(80));
    console.log('\n✨ Le Cron va recréer automatiquement ces échéances !\n');
}

resetDecemberRentals().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
