#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLeasePayments() {
    const leaseId = "32fac8ad-26fd-4760-9f06-9aa6f69036c4";

    console.log("\n=== Tous les paiements pour le bail Massamba Dikhité ===\n");

    const { data: all, error } = await supabase
        .from("rental_transactions")
        .select("*")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erreur:", error.message);
        return;
    }

    console.log(`Total: ${all?.length || 0} transactions\n`);

    all?.forEach((p, i) => {
        console.log(`${i + 1}. ID: ${p.id?.slice(0, 8)}...`);
        console.log(`   Période: ${p.period_month}/${p.period_year}`);
        console.log(`   Montant dû: ${p.amount_due}`);
        console.log(`   Montant payé: ${p.amount_paid || 'null'}`);
        console.log(`   Statut: ${p.status}`);
        console.log(`   Payé le: ${p.paid_at || 'null'}`);
        console.log(`   Méthode: ${p.payment_method || 'null'}`);
        console.log(`   Créé: ${p.created_at}`);
        console.log(`   team_id: ${p.team_id || 'null'}`);
        console.log("");
    });

    const fs = await import("fs");
    const output = all?.map((p, i) =>
        `${i + 1}. ${p.period_month}/${p.period_year} | ${p.amount_due} FCFA | ${p.status} | paid_at: ${p.paid_at || 'null'} | created: ${p.created_at}`
    ).join("\n");
    fs.writeFileSync("LEASE_PAYMENTS.txt", `Bail: ${leaseId}\nTransactions: ${all?.length || 0}\n\n${output}`);
    console.log("\nRésultats écrits dans LEASE_PAYMENTS.txt");
}

checkLeasePayments().then(() => process.exit(0));
