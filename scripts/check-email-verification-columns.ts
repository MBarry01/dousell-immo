/**
 * Script pour vérifier si les colonnes de vérification d'email existent
 * Usage: npx tsx scripts/check-email-verification-columns.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("❌ Variables d'environnement manquantes");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("🔍 Vérification des colonnes de vérification d'email...\n");

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("email_verification_token, email_verification_expires")
            .limit(1);

        if (error) {
            console.log("❌ Colonnes manquantes!");
            console.log("   Erreur:", error.message);
            console.log("\n📋 Veuillez exécuter ce SQL dans Supabase Dashboard > SQL Editor:\n");
            console.log(`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email_verification_token 
ON public.profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;
      `);
        } else {
            console.log("✅ Colonnes email_verification_* présentes!");
            console.log("   Le système d'email de confirmation est prêt.");
        }
    } catch (err) {
        console.error("❌ Erreur:", err);
    }
}

check();
