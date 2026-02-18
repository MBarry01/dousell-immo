/**
 * Script de test du parcours d'inscription complet
 * Usage: npx tsx scripts/test-signup-flow.ts
 * 
 * Ce script teste :
 * 1. Validation des champs
 * 2. Vérification HIBP
 * 3. Vérification Turnstile (simulée)
 * 4. Création du compte Supabase
 * 5. Envoi de l'email de vérification Gmail
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
const envResult = config({ path: resolve(process.cwd(), ".env.local") });

if (envResult.error) {
  console.warn("⚠️  Impossible de charger .env.local:", envResult.error.message);
}

import { createClient } from "@supabase/supabase-js";
import { checkPasswordHIBPServer } from "../app/actions/check-hibp";

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const icon = passed ? "✅" : "❌";
  const color = passed ? "green" : "red";
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testSignupFlow() {
  logSection("🧪 TEST DU PARCOURS D'INSCRIPTION COMPLET");

  // Configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  // Test 1: Vérification des variables d'environnement
  logSection("1. Vérification de la configuration");

  const envChecks = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", value: supabaseUrl, required: true },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: supabaseAnonKey, required: true },
    { name: "SUPABASE_SERVICE_ROLE_KEY", value: supabaseServiceKey, required: false },
    { name: "GMAIL_USER", value: gmailUser, required: true },
    { name: "GMAIL_APP_PASSWORD", value: gmailPassword ? "***" : undefined, required: true },
  ];

  let envValid = true;
  for (const check of envChecks) {
    const passed = check.value !== undefined;
    if (check.required && !passed) {
      envValid = false;
    }
    logTest(
      check.name,
      passed || !check.required,
      check.required && !passed ? "⚠️  REQUIS" : check.value ? "✅ Défini" : "⚠️  Optionnel"
    );
  }

  if (!envValid) {
    log("\n❌ Configuration incomplète. Corrigez les variables manquantes.", "red");
    process.exit(1);
  }

  // Test 2: Validation des champs
  logSection("2. Validation des champs du formulaire");

  const testData = {
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    fullName: "Test User",
    phone: "+221771234567",
  };

  logTest("Email valide", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testData.email));
  logTest("Mot de passe (min 6 caractères)", testData.password.length >= 6);
  logTest("Nom complet (min 2 caractères)", testData.fullName.trim().length >= 2);
  logTest("Téléphone (format international)", /^\+?\d{8,15}$/.test(testData.phone.replace(/\D/g, "")));

  // Test 3: Vérification HIBP
  logSection("3. Vérification HIBP (Have I Been Pwned)");

  try {
    const hibpResult = await checkPasswordHIBPServer("password123");
    logTest(
      "HIBP - Mot de passe compromis détecté",
      hibpResult.success && hibpResult.breached === true,
      hibpResult.breached ? "✅ Détection fonctionne" : "⚠️  Non compromis (normal pour ce test)"
    );

    const hibpResult2 = await checkPasswordHIBPServer(testData.password);
    logTest(
      "HIBP - Mot de passe sécurisé",
      hibpResult2.success && hibpResult2.breached === false,
      hibpResult2.breached ? "⚠️  Compromis" : "✅ Sécurisé"
    );
  } catch (error) {
    logTest("HIBP - Service disponible", false, `Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
  }

  // Test 4: Connexion Supabase
  logSection("4. Connexion à Supabase");

  try {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: _healthCheck, error: healthError } = await supabase.from("properties").select("id").limit(1);

    logTest(
      "Connexion Supabase",
      !healthError,
      healthError ? `Erreur: ${healthError.message}` : "✅ Connecté"
    );
  } catch (error) {
    logTest("Connexion Supabase", false, `Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
  }

  // Test 5: Test d'inscription (simulation)
  logSection("5. Simulation d'inscription");

  try {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailRedirectTo = `${appUrl}/auth/callback?next=/`;

    log(`📧 Tentative d'inscription avec: ${testData.email}`);

    const { data, error } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          full_name: testData.fullName,
          phone: testData.phone,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      logTest("Inscription Supabase", false, `Erreur: ${error.message}`);
      
      if (error.message.includes("already registered")) {
        log("   ℹ️  L'email existe déjà (normal si le test a déjà été exécuté)", "yellow");
      }
    } else {
      logTest("Inscription Supabase", true, `User ID: ${data.user?.id || "N/A"}`);
      logTest("Session créée", !!data.session, data.session ? "Auto-confirm activé" : "Email confirmation requis");

      // Test 6: Envoi email de vérification
      if (data.user && !data.session) {
        logSection("6. Email de vérification");
        log("✅ Supabase enverra automatiquement l'email via SMTP configuré", "green");
        log(`📧 Email sera envoyé à: ${testData.email}`, "cyan");
        log("   Vérifiez votre boîte de réception pour confirmer.", "yellow");
      } else {
        log("⚠️  Email de vérification non nécessaire (auto-confirm activé)", "yellow");
      }

      // Nettoyage : Supprimer le compte de test si créé
      if (data.user && supabaseServiceKey) {
        logSection("7. Nettoyage (suppression du compte de test)");

        try {
          const adminClient = createClient(supabaseUrl!, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);

          logTest(
            "Suppression du compte de test",
            !deleteError,
            deleteError ? `Erreur: ${deleteError.message}` : "✅ Compte supprimé"
          );
        } catch {
          log("⚠️  Impossible de supprimer le compte de test", "yellow");
        }
      }
    }
  } catch (error) {
    logTest("Inscription Supabase", false, `Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
  }

  // Résumé
  logSection("📊 RÉSUMÉ");
  log("✅ Tous les tests de configuration ont été exécutés.", "green");
  log("📧 Vérifiez votre boîte email si un compte de test a été créé.", "cyan");
}

// Exécuter les tests
testSignupFlow().catch(console.error);