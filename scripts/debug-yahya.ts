import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectYahya() {
    console.log("🕵️ --- RECHERCHE CIBLÉE : YAHYA DIENG ---\n");

    // On récupère TOUTES les transactions (sans limite stricte)
    // Structure adaptée : tenant_name est directement dans leases
    const { data: transactions, error } = await supabase
        .from('rental_transactions')
        .select(`
      id,
      amount_due,
      status,
      period_start,
      period_month,
      period_year,
      reminder_sent,
      lease_id,
      leases (
        id,
        tenant_name,
        tenant_email,
        billing_day,
        monthly_amount
      )
    `);

    if (error) {
        console.error("❌ Erreur SQL:", error);
        return;
    }

    // Filtrer pour ne garder que Yahya
    const yahyaTxs = transactions.filter(tx => {
        const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;
        return lease?.tenant_name?.toLowerCase().includes('yahya');
    });

    if (yahyaTxs.length === 0) {
        console.log("❌ AUCUNE transaction trouvée pour un locataire nommé 'Yahya'.");
        console.log("   Vérifie l'orthographe dans la table 'leases' (colonne tenant_name).");
        return;
    }

    console.log(`🔎 ${yahyaTxs.length} transaction(s) trouvée(s) pour Yahya.\n`);

    yahyaTxs.forEach((tx, index) => {
        const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

        console.log(`📝 DOSSIER YAHYA #${index + 1}`);
        console.log(`   ├─ Transaction ID : ${tx.id}`);
        console.log(`   ├─ Statut         : ${tx.status} ${tx.status === 'paid' ? '✅ (Payé)' : '❌ (Impayé)'}`);
        console.log(`   ├─ Période        : ${tx.period_month}/${tx.period_year}`);
        console.log(`   ├─ Date Début     : ${tx.period_start || '⚠️ NULL (Vide - BLOQUANT!)'}`);
        console.log(`   ├─ Montant        : ${tx.amount_due} FCFA`);
        console.log(`   ├─ Email Cible    : ${lease?.tenant_email || '⚠️ PAS D\'EMAIL'}`);
        console.log(`   ├─ Jour Paiement  : ${lease?.billing_day || 5}`);
        console.log(`   └─ Déjà Relancé ? : ${tx.reminder_sent ? 'OUI ✅' : 'NON ❌'}`);

        // ANALYSE DU PROBLEME
        console.log(`\n   🤖 DIAGNOSTIC IA :`);

        const today = new Date();
        const startDate = tx.period_start ? new Date(tx.period_start) : null;

        let daysLate = 0;
        if (startDate) {
            daysLate = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        }

        if (tx.status === 'paid') {
            console.log(`      ❌ BLOQUÉ : Statut = 'paid' (Payé)`);
            console.log(`         Solution : Change le statut en 'pending' pour tester`);
        } else if (tx.reminder_sent) {
            console.log(`      ❌ BLOQUÉ : Déjà relancé (reminder_sent = true)`);
            console.log(`         Solution : Mets reminder_sent à FALSE pour renvoyer`);
        } else if (!startDate) {
            console.log(`      ❌ BLOQUÉ : Pas de date (period_start = NULL)`);
            console.log(`         Solution : Lance 'npx tsx scripts/fix-transaction-dates.ts'`);
        } else if (!lease?.tenant_email) {
            console.log(`      ❌ BLOQUÉ : Pas d'email pour le locataire`);
            console.log(`         Solution : Ajoute un email dans le bail`);
        } else if (daysLate < 5) {
            console.log(`      ⏳ PAS ENCORE : Retard de ${daysLate} jours (< 5 jours requis)`);
            console.log(`         Sera relancé dans ${5 - daysLate} jour(s)`);
        } else {
            console.log(`      ✅ DEVRAIT ÊTRE RELANCÉ !`);
            console.log(`         Retard : ${daysLate} jours (> 5 jours)`);
            console.log(`         Email : ${lease.tenant_email}`);
            console.log(`         Si le mail ne part pas, vérifie les logs du script de relance`);
        }
        console.log("-----------------------------------------------------------\n");
    });

    console.log("\n💡 ACTIONS RECOMMANDÉES :");
    console.log("   1. Si period_start est NULL : npx tsx scripts/fix-transaction-dates.ts");
    console.log("   2. Si status = 'paid' : Change en 'pending' dans Supabase");
    console.log("   3. Si reminder_sent = true : Mets à FALSE pour retester");
    console.log("   4. Puis lance : npx tsx scripts/manual-trigger-reminders.ts");
}

inspectYahya();
