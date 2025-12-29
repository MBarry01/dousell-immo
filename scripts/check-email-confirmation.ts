/**
 * Script pour tester si l'email de confirmation est activé
 * Usage: npx tsx scripts/check-email-confirmation.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkEmailConfirmationSettings() {
  console.log("\n===========================================");
  console.log("🔍 VÉRIFICATION CONFIGURATION EMAIL");
  console.log("===========================================\n");

  try {
    // Créer un utilisateur de test
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";

    console.log("📝 Création d'un utilisateur de test...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false, // Forcer non-confirmé pour tester
    });

    if (error) {
      console.error("❌ Erreur:", error.message);
      return;
    }

    if (!data.user) {
      console.error("❌ Pas d'utilisateur retourné");
      return;
    }

    console.log(`✅ Utilisateur créé: ${data.user.email}`);
    console.log(`   - ID: ${data.user.id}`);
    console.log(`   - Email confirmé: ${data.user.email_confirmed_at ? "✅ OUI" : "❌ NON"}`);
    console.log(`   - Confirmation requise: ${!data.user.email_confirmed_at ? "✅ OUI" : "❌ NON"}`);

    // Nettoyer (supprimer l'utilisateur de test)
    console.log("\n🗑️  Suppression de l'utilisateur de test...");
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log("✅ Nettoyage terminé");

    console.log("\n===========================================");
    console.log("📊 RÉSULTAT");
    console.log("===========================================");

    if (data.user.email_confirmed_at) {
      console.log("🟢 AUTO-CONFIRM ACTIVÉ");
      console.log("   → Les utilisateurs sont connectés immédiatement");
      console.log("   → Pas d'email de confirmation envoyé\n");
    } else {
      console.log("🔵 EMAIL CONFIRMATION ACTIVÉ (Recommandé)");
      console.log("   → Les utilisateurs doivent confirmer leur email");
      console.log("   → Email envoyé automatiquement par Supabase\n");
    }

    console.log("💡 Pour changer ce paramètre:");
    console.log("   1. Dashboard Supabase > Authentication > Settings");
    console.log("   2. Cherchez 'Enable email confirmations'");
    console.log("   3. Activez/Désactivez selon vos besoins\n");

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
  }
}

checkEmailConfirmationSettings();
