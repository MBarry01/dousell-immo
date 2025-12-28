import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erreur: Variables d\'environnement manquantes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestCase() {
    console.log('🧪 Création d\'un cas de test pour les relances...');

    // 1. Trouver une transaction de Décembre 2025
    const { data: transactions, error } = await supabase
        .from('rental_transactions')
        .select('id, status, period_month, period_year, leases(tenant_name, tenant_email)')
        .eq('period_month', 12)
        .eq('period_year', 2025)
        .limit(1);

    if (error || !transactions || transactions.length === 0) {
        console.error('❌ Aucune transaction trouvée pour Décembre 2025');
        return;
    }

    const testTx = transactions[0];
    console.log(`📝 Transaction trouvée: ${testTx.id}`);
    // @ts-ignore
    console.log(`   Locataire: ${testTx.leases?.tenant_name}`);
    console.log(`   Statut actuel: ${testTx.status}`);

    // 2. Modifier le statut en "pending" (en attente) pour simuler un impayé
    const { error: updateError } = await supabase
        .from('rental_transactions')
        .update({
            status: 'pending',
            reminder_sent: false
        })
        .eq('id', testTx.id);

    if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
        return;
    }

    console.log('✅ Transaction modifiée avec succès !');
    console.log('   Nouveau statut: pending (en attente)');
    console.log('   reminder_sent: false');
    console.log('\n🚀 Vous pouvez maintenant lancer:');
    console.log('   npx tsx scripts/manual-trigger-reminders.ts');
}

createTestCase();
