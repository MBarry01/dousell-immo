/**
 * Script pour diagnostiquer la vérification d'email
 * Usage: npx tsx scripts/debug-email-verification.ts [token]
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function diagnose(token?: string) {
    console.log("🔍 Diagnostic de la vérification d'email\n");
    console.log("─".repeat(60));

    // 1. Vérifier les colonnes
    console.log("\n1️⃣ Vérification des colonnes...");
    const { data: sampleProfile, error: colError } = await supabase
        .from("profiles")
        .select("id, email_verification_token, email_verification_expires")
        .limit(1);

    if (colError) {
        console.error("❌ Erreur: Les colonnes n'existent pas!");
        console.error("   Message:", colError.message);
        console.error("\n   → Exécutez la migration SQL dans Supabase Dashboard");
        return;
    }
    console.log("✅ Colonnes présentes");

    // 2. Lister les tokens existants
    console.log("\n2️⃣ Tokens de vérification existants:");
    const { data: profiles, error: listError } = await supabase
        .from("profiles")
        .select("id, full_name, email_verification_token, email_verification_expires")
        .not("email_verification_token", "is", null);

    if (listError) {
        console.error("❌ Erreur:", listError.message);
        return;
    }

    if (profiles && profiles.length > 0) {
        for (const p of profiles) {
            console.log(`\n   📧 ${p.full_name || "N/A"}`);
            console.log(`      ID: ${p.id}`);
            console.log(`      Token: ${p.email_verification_token}`);
            console.log(`      Expire: ${p.email_verification_expires}`);

            const isExpired = new Date(p.email_verification_expires) < new Date();
            console.log(`      Statut: ${isExpired ? "❌ EXPIRÉ" : "✅ VALIDE"}`);
        }
    } else {
        console.log("   ⚠️ Aucun token en attente de vérification");
    }

    // 3. Rechercher un token spécifique
    if (token) {
        console.log("\n3️⃣ Recherche du token spécifique:");
        console.log(`   Token: ${token}`);

        const { data: found, error: findError } = await supabase
            .from("profiles")
            .select("id, full_name, email_verification_token, email_verification_expires")
            .eq("email_verification_token", token)
            .single();

        if (findError) {
            console.log("   ❌ Token non trouvé dans la base de données!");
            console.log("   Erreur:", findError.message);
        } else {
            console.log("   ✅ Token trouvé!");
            console.log(`   Utilisateur: ${found.full_name} (${found.id})`);
        }
    }

    // 4. Vérifier les utilisateurs non confirmés
    console.log("\n4️⃣ Utilisateurs non confirmés:");
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 10,
    });

    if (usersError) {
        console.error("❌ Erreur:", usersError.message);
        return;
    }

    const unconfirmed = users?.filter(u => !u.email_confirmed_at) || [];
    if (unconfirmed.length > 0) {
        for (const u of unconfirmed.slice(0, 5)) {
            console.log(`\n   📧 ${u.email}`);
            console.log(`      ID: ${u.id}`);
            console.log(`      Créé: ${u.created_at}`);
        }
    } else {
        console.log("   ✅ Tous les utilisateurs sont confirmés");
    }

    console.log("\n" + "─".repeat(60));
    console.log("✅ Diagnostic terminé\n");
}

// Récupérer le token depuis les arguments
const token = process.argv[2];
diagnose(token);
