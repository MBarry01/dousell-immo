import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectData() {
    console.log("🕵️ --- DÉBUT DE L'INSPECTION DES RELATIONS ---\n");

    // On récupère TOUTES les transactions non payées pour voir les liens
    // Structure adaptée à ton schéma réel (leases contient directement tenant_name, tenant_email)
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
        tenant_phone,
        monthly_amount,
        billing_day,
        owner_id,
        property_id
      )
    `)
        .neq('status', 'paid'); // On regarde ceux qui posent problème (non payés)

    if (error) {
        console.error("❌ Erreur SQL:", error);
        return;
    }

    console.log(`🔎 ${transactions.length} transactions trouvées (Non Payées). Analyse en cours...\n`);

    if (transactions.length === 0) {
        console.log("✅ Aucune transaction impayée trouvée. Tout est à jour !");
        return;
    }

    transactions.forEach((tx, index) => {
        console.log(`📝 DOSSIER #${index + 1}`);
        console.log(`   ├─ Transaction ID : ${tx.id}`);
        console.log(`   ├─ Montant        : ${tx.amount_due} FCFA`);
        console.log(`   ├─ Statut         : ${tx.status}`);
        console.log(`   ├─ Période        : ${tx.period_month}/${tx.period_year}`);
        console.log(`   ├─ Date Début     : ${tx.period_start || 'NULL ⚠️'}`);
        console.log(`   ├─ Relance envoyée: ${tx.reminder_sent ? 'OUI ✅' : 'NON ❌'}`);

        // Vérification du BAIL
        if (!tx.leases) {
            console.log(`   ❌ ERREUR CRITIQUE: Aucun bail lié (leases est null)`);
            console.log(`   └─ Cette transaction est orpheline !`);
        } else if (Array.isArray(tx.leases)) {
            console.log(`   ⚠️ ATTENTION: 'leases' est un TABLEAU (Taille: ${tx.leases.length})`);
            console.log(`   └─ Cause probable: Mauvaise configuration de la relation FK`);
            if (tx.leases.length > 0) {
                // @ts-ignore
                const firstLease = tx.leases[0];
                console.log(`   └─ Premier bail: ${firstLease.tenant_name} (${firstLease.tenant_email})`);
            }
        } else {
            // Cas normal : leases est un objet unique
            const lease = tx.leases;
            console.log(`   ├─ LIEN Bail ID   : ${lease.id}`);
            console.log(`   ├─ Montant bail   : ${lease.monthly_amount} FCFA`);
            console.log(`   ├─ Jour paiement  : ${lease.billing_day || 5}`);
            console.log(`   ├─ Owner ID       : ${lease.owner_id || 'NULL ⚠️'}`);
            console.log(`   └─ 👤 LOCATAIRE :`);
            console.log(`       ├─ Nom   : ${lease.tenant_name}`);
            console.log(`       ├─ Email : ${lease.tenant_email || 'Pas d\'email ⚠️'}`);
            console.log(`       └─ Tél   : ${lease.tenant_phone || 'Pas de téléphone'}`);
        }
        console.log("-----------------------------------------------------------\n");
    });

    console.log("\n🎯 RÉSUMÉ DE L'ANALYSE:");
    console.log(`   Total transactions impayées : ${transactions.length}`);
    const withEmail = transactions.filter(t => {
        const lease = Array.isArray(t.leases) ? t.leases[0] : t.leases;
        return lease?.tenant_email;
    }).length;
    console.log(`   Avec email valide           : ${withEmail}`);
    console.log(`   Sans email (non relançables): ${transactions.length - withEmail}`);

    const withPeriodStart = transactions.filter(t => t.period_start).length;
    console.log(`   Avec period_start rempli    : ${withPeriodStart}`);
    console.log(`   Sans period_start (bug)     : ${transactions.length - withPeriodStart}`);
}

inspectData();
