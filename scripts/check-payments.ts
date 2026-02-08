#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPayments() {
    console.log("\n=== VÉRIFICATION DES PAIEMENTS RÉCENTS ===\n");

    // Récupérer les paiements récents
    const { data: payments, error } = await supabase
        .from("rental_transactions")
        .select(`
      id, 
      lease_id, 
      amount_due, 
      status, 
      period_month, 
      period_year, 
      created_at,
      lease:leases (
        tenant_name,
        property_address
      )
    `)
        .order("created_at", { ascending: false })
        .limit(15);

    if (error) {
        console.error("Erreur:", error.message);
        return;
    }

    console.log(`Trouvé ${payments?.length || 0} paiements depuis le 08/02/2026:\n`);

    payments?.forEach((p, i) => {
        const tenant = (p.lease as any)?.tenant_name || "N/A";
        const address = (p.lease as any)?.property_address || "N/A";
        console.log(`${i + 1}. ${tenant}`);
        console.log(`   Bail: ${p.lease_id?.slice(0, 8)}...`);
        console.log(`   Adresse: ${address?.slice(0, 40)}...`);
        console.log(`   Montant: ${p.amount_due} FCFA`);
        console.log(`   Statut: ${p.status}`);
        console.log(`   Période: ${p.period_month}/${p.period_year}`);
        console.log(`   Créé: ${p.created_at}`);
        console.log("");
    });

    // Write to file for easy reading
    const fs = await import("fs");
    const output = payments?.map((p, i) => {
        const tenant = (p.lease as any)?.tenant_name || "N/A";
        return `${i + 1}. ${tenant} | Statut: ${p.status} | ${p.period_month}/${p.period_year} | ${p.amount_due} FCFA | Créé: ${p.created_at}`;
    }).join("\n");
    fs.writeFileSync("PAYMENTS_CHECK.txt", `Trouvé ${payments?.length || 0} paiements:\n\n${output}`);
    console.log("\nRésultats écrits dans PAYMENTS_CHECK.txt");
}

checkPayments().then(() => process.exit(0));
