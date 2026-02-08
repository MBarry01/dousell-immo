#!/usr/bin/env npx tsx
/**
 * Génère un nouveau Magic Link et l'affiche proprement
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

async function generateMagicLink() {
    // Trouver le premier bail actif
    const { data: lease, error } = await supabase
        .from("leases")
        .select("id, tenant_name, tenant_email")
        .eq("status", "active")
        .limit(1)
        .single();

    if (error || !lease) {
        console.error("Erreur: Aucun bail actif trouvé");
        return;
    }

    // Générer un nouveau token
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Mettre à jour le bail
    const { error: updateError } = await supabase
        .from("leases")
        .update({
            tenant_access_token: hashedToken,
            tenant_token_expires_at: expiresAt.toISOString(),
            tenant_token_verified: false,
        })
        .eq("id", lease.id);

    if (updateError) {
        console.error("Erreur mise à jour:", updateError.message);
        return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/locataire?token=${rawToken}`;

    console.log("\n========================================");
    console.log("NOUVEAU MAGIC LINK GENERE");
    console.log("========================================");
    console.log(`Locataire: ${lease.tenant_name}`);
    console.log(`Email: ${lease.tenant_email || "Non défini"}`);
    console.log(`Expire: ${expiresAt.toISOString()}`);
    console.log("");
    console.log("LIEN A TESTER:");
    console.log(magicLink);
    console.log("========================================\n");

    // Écrire dans un fichier pour accès facile
    const fs = await import("fs");
    fs.writeFileSync("MAGIC_LINK.txt", `LIEN MAGIC LOCATAIRE\n\n${magicLink}\n\nLocataire: ${lease.tenant_name}\nExpire: ${expiresAt.toISOString()}\n`);
    console.log("Lien sauvegardé dans MAGIC_LINK.txt");
}

generateMagicLink().then(() => process.exit(0));
