#!/usr/bin/env npx tsx
/**
 * Script to manually create a paid payment for Massamba Dikhité (February 2026)
 * to fix the missing payment issue.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createMissingPayment() {
    const leaseId = "32fac8ad-26fd-4760-9f06-9aa6f69036c4";
    const periodMonth = 2;
    const periodYear = 2026;

    console.log("\n=== Création du paiement manquant ===\n");

    // Get lease details
    const { data: lease, error: leaseErr } = await supabase
        .from("leases")
        .select("team_id, owner_id, monthly_amount, tenant_name")
        .eq("id", leaseId)
        .single();

    if (leaseErr || !lease) {
        console.error("Erreur récupération bail:", leaseErr?.message);
        return;
    }

    console.log(`Bail trouvé: ${lease.tenant_name}`);
    console.log(`Montant: ${lease.monthly_amount} FCFA`);
    console.log(`team_id: ${lease.team_id}`);
    console.log(`owner_id: ${lease.owner_id}`);

    // Check if already exists
    const { data: existing } = await supabase
        .from("rental_transactions")
        .select("id, status")
        .eq("lease_id", leaseId)
        .eq("period_month", periodMonth)
        .eq("period_year", periodYear)
        .maybeSingle();

    if (existing) {
        console.log(`\n⚠️ Transaction existe déjà: ${existing.id} (status: ${existing.status})`);

        // Update to paid
        const { error: updateErr } = await supabase
            .from("rental_transactions")
            .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                amount_paid: lease.monthly_amount,
                payment_method: "stripe",
                payment_ref: "manual_fix_" + Date.now(),
            })
            .eq("id", existing.id);

        if (updateErr) {
            console.error("❌ Erreur mise à jour:", updateErr.message, updateErr);
        } else {
            console.log("✅ Paiement mis à jour vers 'paid'");
        }
        return;
    }

    // Insert new payment (without payment_method/payment_ref that may not exist)
    const { data: inserted, error: insertErr } = await supabase
        .from("rental_transactions")
        .insert({
            lease_id: leaseId,
            period_month: periodMonth,
            period_year: periodYear,
            amount_due: lease.monthly_amount,
            amount_paid: lease.monthly_amount,
            status: "paid",
            paid_at: new Date().toISOString(),
            team_id: lease.team_id,
            owner_id: lease.owner_id,
            meta: { provider: "stripe", source: "manual_fix", timestamp: Date.now() },
        })
        .select("id")
        .single();

    if (insertErr) {
        console.error("❌ Erreur insertion:", insertErr.message);
        console.error("Code:", insertErr.code);
        console.error("Détails:", insertErr.details);
        console.error("Hint:", insertErr.hint);
    } else {
        console.log(`\n✅ Paiement créé: ${inserted?.id}`);
    }
}

createMissingPayment().then(() => process.exit(0));
