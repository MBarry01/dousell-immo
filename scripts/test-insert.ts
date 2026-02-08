#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testInsert() {
    const leaseId = "32fac8ad-26fd-4760-9f06-9aa6f69036c4";

    // Get lease for team_id
    const { data: lease } = await supabase
        .from("leases")
        .select("team_id, owner_id, monthly_amount")
        .eq("id", leaseId)
        .single();

    console.log("Lease:", lease);

    // Test minimal insert
    console.log("\n=== Test 1: Insert minimal ===");
    const { data: t1, error: e1 } = await supabase
        .from("rental_transactions")
        .insert({
            lease_id: leaseId,
            period_month: 2,
            period_year: 2026,
            amount_due: lease?.monthly_amount || 15000,
            status: "paid",
            team_id: lease?.team_id,
        })
        .select("id")
        .single();

    if (e1) {
        console.log("Erreur test 1:", e1.message, "| Code:", e1.code);
        console.log("Details:", e1.details, "| Hint:", e1.hint);
    } else {
        console.log("Succès test 1:", t1?.id);
    }
}

testInsert().then(() => process.exit(0));
