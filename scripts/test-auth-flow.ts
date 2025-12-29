/**
 * Script de test du flow d'authentification
 * Teste la création de compte et la vérification d'email
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log("🧪 Test du flow d'authentification\n");

  // Générer un email de test unique
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testName = "Test User";
  const testPhone = "+221771234567";

  console.log("📧 Email de test:", testEmail);
  console.log("🔐 Mot de passe:", testPassword);
  console.log();

  try {
    // Étape 1: Inscription
    console.log("1️⃣ Inscription en cours...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          phone: testPhone,
        },
        emailRedirectTo: "http://localhost:3000/auth/confirm?next=/",
      },
    });

    if (signUpError) {
      console.error("❌ Erreur lors de l'inscription:", signUpError.message);
      return;
    }

    console.log("✅ Inscription réussie !");
    console.log("   User ID:", signUpData.user?.id);
    console.log("   Email:", signUpData.user?.email);
    console.log("   Email confirmé:", signUpData.user?.email_confirmed_at ? "Oui" : "Non");
    console.log();

    // Vérifier si une session a été créée (auto-confirm activé)
    if (signUpData.session) {
      console.log("✅ Auto-confirmation activée - Session créée automatiquement");
      console.log("   Access Token:", signUpData.session.access_token.substring(0, 20) + "...");
    } else {
      console.log("📧 Email de confirmation requis");
      console.log("   Vérifiez votre boîte email pour le lien de confirmation");
      console.log("   Le lien devrait pointer vers: http://localhost:3000/auth/confirm");
    }

    console.log();
    console.log("📋 Résumé de la configuration:");
    console.log("   - Redirect URL:", "http://localhost:3000/auth/confirm?next=/");
    console.log("   - Auto-confirm:", signUpData.session ? "Activé" : "Désactivé");
    console.log("   - Email confirmation required:", !signUpData.session);

  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
  }
}

// Exécuter le test
testAuthFlow()
  .then(() => {
    console.log("\n✅ Test terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test échoué:", error);
    process.exit(1);
  });
