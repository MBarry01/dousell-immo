// Script pour réinitialiser les flags reminder_sent
// Utilise le client admin pour bypasser RLS

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    console.log('Ajoutez dans votre terminal:');
    console.log('export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetReminderFlags() {
    console.log('\n=== RESET REMINDER FLAGS ===\n');

    // 1. Vérifier l'état actuel
    const { data: before, error: beforeError } = await supabase
        .from('rental_transactions')
        .select('id, period_month, period_year, status, reminder_sent, leases(tenant_name)')
        .eq('period_month', 12)
        .eq('period_year', 2025)
        .neq('status', 'paid');

    if (beforeError) {
        console.error('Erreur:', beforeError);
        return;
    }

    console.log(`Transactions non payées trouvées: ${before.length}\n`);
    before.forEach((tx: any) => {
        console.log(`- ${tx.leases?.tenant_name || 'Inconnu'}: reminder_sent = ${tx.reminder_sent}`);
    });

    // 2. Reset tous les flags reminder_sent à false
    const { error: updateError } = await supabase
        .from('rental_transactions')
        .update({ reminder_sent: false })
        .eq('period_month', 12)
        .eq('period_year', 2025)
        .neq('status', 'paid');

    if (updateError) {
        console.error('\n❌ Erreur lors du reset:', updateError);
        return;
    }

    console.log('\n✅ Flags reminder_sent réinitialisés avec succès!');

    // 3. Vérifier le résultat
    const { data: after } = await supabase
        .from('rental_transactions')
        .select('id, reminder_sent, leases(tenant_name)')
        .eq('period_month', 12)
        .eq('period_year', 2025)
        .neq('status', 'paid');

    console.log('\nÉtat après reset:');
    after?.forEach((tx: any) => {
        console.log(`- ${tx.leases?.tenant_name || 'Inconnu'}: reminder_sent = ${tx.reminder_sent}`);
    });

    console.log('\n=== TERMINÉ ===\n');
}

resetReminderFlags();
