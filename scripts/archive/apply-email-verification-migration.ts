/**
 * Script pour appliquer la migration de vérification d'email
 * Usage: npx tsx scripts/apply-email-verification-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Charger .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Variables d'environnement manquantes:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "✅" : "❌");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function applyMigration() {
    console.log("🔄 Application de la migration email_verification...\n");

    try {
        // Vérifier si les colonnes existent déjà
        const { data: _columns, error: _checkError } = await supabase
            .from("profiles")
            .select("*")
            .limit(0);

        // Si pas d'erreur, la table existe. On tente d'ajouter les colonnes
        // via RPC ou une query directe (nécessite la fonction rpc)

        // Alternative: utiliser l'API REST admin pour exécuter du SQL
        // Malheureusement Supabase JS client ne supporte pas directement les ALTER TABLE
        // Il faut le faire via le Dashboard ou via supabase db push

        console.log("⚠️  Ne peut pas exécuter ALTER TABLE directement via l'API.");
        console.log("\n📋 Veuillez exécuter ce SQL dans le Dashboard Supabase:");
        console.log("   1. Allez sur https://supabase.com/dashboard");
        console.log("   2. Sélectionnez votre projet");
        console.log("   3. Allez dans 'SQL Editor'");
        console.log("   4. Copiez-collez le SQL suivant:\n");
        console.log("─".repeat(60));
        console.log(`
-- Migration: Add email verification columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ DEFAULT NULL;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_email_verification_token 
ON public.profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;
    `);
        console.log("─".repeat(60));
        console.log("\n   5. Cliquez sur 'Run' pour exécuter");
        console.log("\n✅ Une fois fait, la fonctionnalité d'email sera opérationnelle!");

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

applyMigration();
