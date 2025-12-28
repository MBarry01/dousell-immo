import { createAdminClient } from '../lib/supabase-admin';
import { differenceInDays } from 'date-fns';

async function checkRemindersLogic() {
    const supabase = createAdminClient();
    const today = new Date();

    console.log('\n=== DIAGNOSTIC RELANCES J+5 ===\n');
    console.log('Date actuelle:', today.toISOString());
    console.log('Jour du mois:', today.getDate());

    // Récupérer toutes les transactions non payées de Décembre 2025
    const { data: transactions, error } = await supabase
        .from('rental_transactions')
        .select(`
            id,
            period_month,
            period_year,
            status,
            reminder_sent,
            leases (
                tenant_name,
                tenant_email,
                billing_day,
                monthly_amount
            )
        `)
        .eq('period_month', 12)
        .eq('period_year', 2025)
        .neq('status', 'paid');

    if (error) {
        console.error('Erreur:', error);
        return;
    }

    console.log(`\nTransactions non payées trouvées: ${transactions.length}\n`);

    transactions.forEach((trans: any) => {
        const billingDay = trans.leases?.billing_day || 5;
        const dueDate = new Date(2025, 11, billingDay); // Décembre 2025
        const daysOverdue = differenceInDays(today, dueDate);

        console.log('---');
        console.log('Locataire:', trans.leases?.tenant_name);
        console.log('Email:', trans.leases?.tenant_email);
        console.log('Montant:', trans.leases?.monthly_amount, 'FCFA');
        console.log('Jour de facturation:', billingDay);
        console.log('Date d\'échéance:', dueDate.toISOString().split('T')[0]);
        console.log('Jours de retard:', daysOverdue);
        console.log('Statut:', trans.status);
        console.log('Relance déjà envoyée?', trans.reminder_sent);

        // Vérifier si devrait recevoir une relance
        if (daysOverdue >= 5 && !trans.reminder_sent && trans.leases?.tenant_email) {
            console.log('✅ DEVRAIT RECEVOIR RELANCE');
        } else {
            console.log('❌ PAS DE RELANCE:');
            if (daysOverdue < 5) console.log('   - Pas encore J+5');
            if (trans.reminder_sent) console.log('   - Relance déjà envoyée');
            if (!trans.leases?.tenant_email) console.log('   - Email manquant');
        }
    });

    console.log('\n=== FIN DIAGNOSTIC ===\n');
}

checkRemindersLogic();
