#!/usr/bin/env npx tsx
/**
 * Script de diagnostic pour le flux Magic Link Locataire
 *
 * Ce script teste:
 * 1. La génération de token
 * 2. Le stockage en DB (hash)
 * 3. La validation du token
 *
 * Usage: npx tsx scripts/debug-tenant-token.ts <lease_id>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Même fonction de hash que dans tenant-magic-link.ts
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

async function diagnoseTokenFlow(leaseId?: string) {
    console.log("\n=== DIAGNOSTIC MAGIC LINK LOCATAIRE ===\n");

    // 1. Trouver un bail actif pour tester
    if (!leaseId) {
        const { data: leases, error } = await supabase
            .from("leases")
            .select("id, tenant_name, tenant_email, status, tenant_access_token, tenant_token_expires_at")
            .eq("status", "active")
            .limit(3);

        if (error) {
            console.error("❌ Erreur Supabase:", error.message);
            return;
        }

        if (!leases?.length) {
            console.log("❌ Aucun bail actif trouvé");
            return;
        }

        console.log("📋 Baux actifs trouvés:");
        leases.forEach((l, i) => {
            const hasToken = l.tenant_access_token ? "✅" : "❌";
            const tokenExpired = l.tenant_token_expires_at
                ? new Date(l.tenant_token_expires_at) < new Date()
                    ? "(expiré)"
                    : `(valide jusqu'au ${new Date(l.tenant_token_expires_at).toLocaleDateString()})`
                : "";
            console.log(`  ${i + 1}. ${l.tenant_name} (${l.id})`);
            console.log(`     Token: ${hasToken} ${tokenExpired}`);
            console.log(`     Hash stocké: ${l.tenant_access_token?.slice(0, 20)}...`);
        });

        leaseId = leases[0].id;
        console.log(`\n→ Test avec le bail: ${leaseId}\n`);
    }

    // 2. Récupérer les infos du bail
    const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("*")
        .eq("id", leaseId)
        .single();

    if (leaseError || !lease) {
        console.error("❌ Bail introuvable:", leaseError?.message);
        return;
    }

    console.log("📋 Informations du bail:");
    console.log(`   - ID: ${lease.id}`);
    console.log(`   - Locataire: ${lease.tenant_name}`);
    console.log(`   - Email: ${lease.tenant_email || "Non défini"}`);
    console.log(`   - Statut: ${lease.status}`);
    console.log(`   - Token stocké: ${lease.tenant_access_token ? lease.tenant_access_token.slice(0, 30) + "..." : "Aucun"}`);
    console.log(`   - Longueur token stocké: ${lease.tenant_access_token?.length || 0} caractères`);
    console.log(`   - Token vérifié: ${lease.tenant_token_verified ? "Oui" : "Non"}`);
    console.log(`   - Expiration: ${lease.tenant_token_expires_at || "Non défini"}`);

    // 3. Test de génération de token (simulation)
    console.log("\n🔐 Simulation génération de token:");
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);

    console.log(`   - Raw token (envoyé par email): ${rawToken}`);
    console.log(`   - Longueur raw token: ${rawToken.length} caractères`);
    console.log(`   - Hash SHA-256 (stocké en DB): ${hashedToken}`);
    console.log(`   - Longueur hash: ${hashedToken.length} caractères`);

    // 4. Test de validation
    console.log("\n🔍 Test de validation:");

    // Simuler ce qui se passe quand on reçoit un token
    if (lease.tenant_access_token) {
        // Tester avec le token actuel (on ne peut pas car on n'a pas le raw token)
        console.log("   ⚠️  Impossible de tester la validation car on n'a pas le raw token original");
        console.log("   → Le raw token a été envoyé par email et n'est pas stocké");

        // Vérifier que le hash stocké est bien un hash SHA-256 (64 caractères hex)
        const isValidHashFormat = /^[a-f0-9]{64}$/i.test(lease.tenant_access_token);
        console.log(`   → Format du hash stocké valide: ${isValidHashFormat ? "✅ Oui" : "❌ Non (problème!)"}`);

        if (!isValidHashFormat) {
            console.log("\n⚠️  PROBLÈME DÉTECTÉ:");
            console.log(`   Le token stocké (${lease.tenant_access_token.length} chars) n'a pas le format SHA-256 attendu (64 chars)`);
            console.log("   Cela peut arriver si le raw token a été stocké au lieu du hash");
        }
    }

    // 5. Test avec un faux token pour voir l'erreur
    console.log("\n🧪 Test query DB avec token de test:");
    const testHash = hashToken("test-token-12345");
    const { data: testResult, error: testError } = await supabase
        .from("leases")
        .select("id")
        .eq("tenant_access_token", testHash)
        .eq("status", "active")
        .maybeSingle();

    if (testError) {
        console.log(`   ❌ Erreur query: ${testError.message}`);
        console.log(`   Code: ${testError.code}`);
    } else {
        console.log(`   → Résultat (devrait être null): ${testResult ? "Trouvé (bizarre!)" : "null (correct)"}`);
    }

    // 6. Générer un nouveau token pour ce bail
    console.log("\n🆕 Génération d'un nouveau token de test:");

    const newRawToken = randomBytes(32).toString("hex");
    const newHashedToken = hashToken(newRawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log(`   New raw token: ${newRawToken}`);
    console.log(`   New hash: ${newHashedToken}`);

    const { error: updateError } = await supabase
        .from("leases")
        .update({
            tenant_access_token: newHashedToken,
            tenant_token_expires_at: expiresAt.toISOString(),
            tenant_token_verified: false,
        })
        .eq("id", leaseId);

    if (updateError) {
        console.log(`   ❌ Erreur mise à jour: ${updateError.message}`);
    } else {
        console.log("   ✅ Token mis à jour en DB");

        // Vérifier la récupération
        const { data: updatedLease } = await supabase
            .from("leases")
            .select("tenant_access_token")
            .eq("id", leaseId)
            .single();

        const storedMatches = updatedLease?.tenant_access_token === newHashedToken;
        console.log(`   → Vérification: Hash stocké correspond: ${storedMatches ? "✅ Oui" : "❌ Non"}`);

        // Test de validation avec le nouveau token
        const hashOfNewRaw = hashToken(newRawToken);
        const validationMatches = hashOfNewRaw === updatedLease?.tenant_access_token;
        console.log(`   → Validation: hash(raw) === stored: ${validationMatches ? "✅ Match!" : "❌ No match"}`);

        // Générer l'URL Magic Link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const magicLink = `${baseUrl}/locataire?token=${newRawToken}`;

        console.log("\n🔗 LIEN MAGIC LINK DE TEST:");
        console.log(`   ${magicLink}`);
        console.log("\n   ↑ Utilisez ce lien pour tester l'accès locataire");
    }

    console.log("\n=== FIN DU DIAGNOSTIC ===\n");
}

// Exécution
const leaseIdArg = process.argv[2];
diagnoseTokenFlow(leaseIdArg).catch(console.error);
