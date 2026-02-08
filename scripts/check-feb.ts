#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFeb2026() {
    console.log("\n=== Tous les paiements Février 2026 ===\n");

    const { data: all, error } = await supabase
        .from("rental_transactions")
        .select(`
      id, 
      lease_id, 
      amount_due, 
      status, 
      period_month, 
      period_year, 
      created_at,
      paid_at,
      team_id,
      lease:leases (
        tenant_name
      )
    `)
        .eq("period_month", 2)
        .eq("period_year", 2026)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erreur:", error.message);
        return;
    }

    console.log(`Total février 2026: ${all?.length || 0} transactions\n`);

    all?.forEach((p, i) => {
        const tenant = (p.lease as any)?.tenant_name || "N/A";
        console.log(`${i + 1}. ${tenant}`);
        console.log(`   Bail: ${p.lease_id?.slice(0, 8)}...`);
        console.log(`   Statut: ${p.status}`);
        console.log(`   Montant: ${p.amount_due}`);
        console.log(`   paid_at: ${p.paid_at || 'null'}`);
        console.log(`   team_id: ${p.team_id || 'null'}`);
        console.log(`   Créé: ${p.created_at}`);
        console.log("");
    });

    const fs = await import("fs");
    const output = all?.map((p, i) => {
        const tenant = (p.lease as any)?.tenant_name || "N/A";
        return `${i + 1}. ${tenant} | ${p.lease_id?.slice(0, 8)}... | ${p.status} | ${p.amount_due} FCFA | paid: ${p.paid_at ? 'OUI' : 'NON'}`;
    }).join("\n");
    fs.writeFileSync("FEB_2026_PAYMENTS.txt", `Paiements Février 2026: ${all?.length || 0}\n\n${output}`);
}

checkFeb2026().then(() => process.exit(0));
