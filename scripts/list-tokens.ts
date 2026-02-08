#!/usr/bin/env npx tsx
/**
 * Script rapide pour lister les tokens actifs
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listTokens() {
    const { data, error } = await supabase
        .from("leases")
        .select("id, tenant_name, tenant_email, tenant_access_token, tenant_token_expires_at, status")
        .eq("status", "active")
        .not("tenant_access_token", "is", null)
        .limit(5);

    if (error) {
        console.error("Erreur:", error.message);
        return;
    }

    console.log("\n=== BAUX ACTIFS AVEC TOKENS ===\n");

    if (!data?.length) {
        console.log("Aucun bail avec token trouvé");
        return;
    }

    data.forEach((l, i) => {
        const isExpired = l.tenant_token_expires_at
            ? new Date(l.tenant_token_expires_at) < new Date()
            : true;

        console.log(`${i + 1}. ${l.tenant_name}`);
        console.log(`   Email: ${l.tenant_email || "Non défini"}`);
        console.log(`   Token hash: ${l.tenant_access_token?.slice(0, 40)}...`);
        console.log(`   Longueur: ${l.tenant_access_token?.length} chars`);
        console.log(`   Expire: ${l.tenant_token_expires_at}`);
        console.log(`   Expiré: ${isExpired ? "❌ OUI" : "✅ NON"}`);
        console.log("");
    });
}

listTokens().then(() => process.exit(0));
