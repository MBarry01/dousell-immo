/**
 * Script de diagnostic pour tester la configuration OTP Email
 *
 * Usage: npx tsx scripts/test-otp-config.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✅" : "❌");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testOtpConfig() {
  console.log("\n🔍 Diagnostic de la configuration OTP Email\n");
  console.log("=".repeat(50));

  let unconfirmedUsersCount = 0;

  // 1. Tester la connexion Supabase
  console.log("\n1️⃣ Test de connexion Supabase...");
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      console.error("❌ Erreur de connexion:", error.message);
      return;
    }

    console.log("✅ Connexion Supabase OK");
    console.log(`   Nombre total d'utilisateurs: ${data.users.length > 0 ? data.users.length + "+" : "0"}`);
  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
    return;
  }

  // 2. Lister les utilisateurs de test
  console.log("\n2️⃣ Utilisateurs de test trouvés...");
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      console.error("❌ Impossible de lister les utilisateurs:", error.message);
      return;
    }

    const unconfirmedUsers = data.users.filter((u) => !u.email_confirmed_at);
    const confirmedUsers = data.users.filter((u) => u.email_confirmed_at);
    unconfirmedUsersCount = unconfirmedUsers.length;

    console.log(`✅ Total: ${data.users.length} utilisateur(s)`);
    console.log(`   📧 Confirmés: ${confirmedUsers.length}`);
    console.log(`   ⏳ Non confirmés: ${unconfirmedUsers.length}`);

    if (unconfirmedUsers.length > 0) {
      console.log("\n   ⚠️ Utilisateurs non confirmés (peuvent bloquer les tests) :");
      unconfirmedUsers.forEach((u) => {
        console.log(`      - ${u.email} (créé le ${new Date(u.created_at).toLocaleString()})`);
      });
    }
  } catch (err) {
    console.error("❌ Erreur lors de la liste des utilisateurs:", err);
  }

  // 3. Recommandations
  console.log("\n3️⃣ Recommandations...");
  console.log("\n📋 Checklist de configuration Supabase :");
  console.log("   [ ] Authentication → Providers → Email : Enable email provider = ON");
  console.log("   [ ] Authentication → Providers → Email : Confirm email = ON");
  console.log("   [ ] Authentication → Providers → Email : Enable email confirmations = ON");
  console.log("   [ ] Authentication → Email Templates → Confirm signup : Template personnalisé configuré");
  console.log("   [ ] Settings → Auth → SMTP Settings : SMTP personnalisé configuré (Gmail ou SendGrid)");

  console.log("\n🔧 Actions recommandées :");
  if (unconfirmedUsersCount > 0) {
    console.log("   1. Supprimez les utilisateurs non confirmés dans le Dashboard Supabase");
    console.log("   2. Attendez 5 minutes (rate limiting)");
  } else {
    console.log("   1. Vérifiez la configuration Email dans le Dashboard Supabase");
    console.log("   2. Configurez un SMTP personnalisé (Gmail ou SendGrid)");
  }
  console.log("   3. Testez l'envoi d'email avec le bouton 'Send test email' dans les SMTP Settings");
  console.log("   4. Créez un nouveau compte de test avec un email différent");

  console.log("\n📖 Documentation complète :");
  console.log("   - docs/CONFIGURATION_OTP.md");
  console.log("   - docs/DIAGNOSTIC_OTP.md");

  console.log("\n" + "=".repeat(50));
  console.log("✅ Diagnostic terminé\n");
}

// Exécuter le diagnostic
testOtpConfig().catch((err) => {
  console.error("\n❌ Erreur fatale:", err);
  process.exit(1);
});
