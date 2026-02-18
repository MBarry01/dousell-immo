/**
 * Script de vérification des problèmes potentiels dans le parcours d'inscription
 * Usage: npx tsx scripts/check-signup-issues.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// Charger les variables d'environnement
const envResult = config({ path: resolve(process.cwd(), ".env.local") });

if (envResult.error) {
  console.warn("⚠️  Impossible de charger .env.local:", envResult.error.message);
}

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logIssue(issue: string, severity: "error" | "warning" | "info") {
  const icon = severity === "error" ? "❌" : severity === "warning" ? "⚠️" : "ℹ️";
  const color = severity === "error" ? "red" : severity === "warning" ? "yellow" : "cyan";
  log(`${icon} ${issue}`, color);
}

async function checkSignupIssues() {
  console.log("\n" + "=".repeat(60));
  log("🔍 VÉRIFICATION DES PROBLÈMES POTENTIELS", "cyan");
  console.log("=".repeat(60) + "\n");

  const issues: Array<{ severity: "error" | "warning" | "info"; message: string }> = [];

  // 1. Vérifier les fichiers critiques
  log("1. Vérification des fichiers critiques", "cyan");
  const criticalFiles = [
    "app/register/page.tsx",
    "app/auth/actions.ts",
    "app/auth/callback/route.ts",
    "lib/mail-gmail.ts",
  ];

  for (const file of criticalFiles) {
    if (existsSync(file)) {
      log(`   ✅ ${file}`, "green");
    } else {
      issues.push({ severity: "error", message: `Fichier manquant: ${file}` });
      logIssue(`Fichier manquant: ${file}`, "error");
    }
  }

  // 2. Vérifier les imports dans app/register/page.tsx
  log("\n2. Vérification des imports", "cyan");
  try {
    const registerContent = readFileSync("app/register/page.tsx", "utf-8");
    
    const requiredImports = [
      "signup",
      "resendConfirmationEmail",
      "PhoneInput",
      "Captcha",
    ];

    for (const imp of requiredImports) {
      if (registerContent.includes(imp)) {
        log(`   ✅ Import ${imp}`, "green");
      } else {
        issues.push({ severity: "error", message: `Import manquant: ${imp}` });
        logIssue(`Import manquant: ${imp}`, "error");
      }
    }

    // Vérifier la gestion de emailSent
    if (registerContent.includes("emailSent") && registerContent.includes("setEmailSent")) {
      log(`   ✅ Gestion de emailSent`, "green");
    } else {
      issues.push({ severity: "warning", message: "Gestion de emailSent incomplète" });
      logIssue("Gestion de emailSent incomplète", "warning");
    }
  } catch (error) {
    issues.push({ severity: "error", message: `Erreur lecture app/register/page.tsx: ${error}` });
    logIssue(`Erreur lecture app/register/page.tsx: ${error}`, "error");
  }

  // 3. Vérifier app/auth/actions.ts
  log("\n3. Vérification de app/auth/actions.ts", "cyan");
  try {
    const actionsContent = readFileSync("app/auth/actions.ts", "utf-8");
    
    const requiredFunctions = [
      "export async function signup",
      "export async function resendConfirmationEmail",
      "sendVerificationEmailGmail",
    ];

    for (const func of requiredFunctions) {
      if (actionsContent.includes(func)) {
        log(`   ✅ Fonction trouvée: ${func.split(" ")[3]}`, "green");
      } else {
        issues.push({ severity: "error", message: `Fonction manquante: ${func}` });
        logIssue(`Fonction manquante: ${func}`, "error");
      }
    }

    // Vérifier la gestion de emailConfirmationRequired
    if (actionsContent.includes("emailConfirmationRequired")) {
      log(`   ✅ Gestion de emailConfirmationRequired`, "green");
    } else {
      issues.push({ severity: "warning", message: "Gestion de emailConfirmationRequired manquante" });
      logIssue("Gestion de emailConfirmationRequired manquante", "warning");
    }
  } catch (error) {
    issues.push({ severity: "error", message: `Erreur lecture app/auth/actions.ts: ${error}` });
    logIssue(`Erreur lecture app/auth/actions.ts: ${error}`, "error");
  }

  // 4. Vérifier app/auth/callback/route.ts
  log("\n4. Vérification de app/auth/callback/route.ts", "cyan");
  try {
    const callbackContent = readFileSync("app/auth/callback/route.ts", "utf-8");
    
    if (callbackContent.includes("exchangeCodeForSession")) {
      log(`   ✅ exchangeCodeForSession utilisé`, "green");
    } else {
      issues.push({ severity: "error", message: "exchangeCodeForSession manquant dans callback" });
      logIssue("exchangeCodeForSession manquant dans callback", "error");
    }

    if (callbackContent.includes("GET")) {
      log(`   ✅ Route GET définie`, "green");
    } else {
      issues.push({ severity: "error", message: "Route GET manquante dans callback" });
      logIssue("Route GET manquante dans callback", "error");
    }
  } catch (error) {
    issues.push({ severity: "error", message: `Erreur lecture app/auth/callback/route.ts: ${error}` });
    logIssue(`Erreur lecture app/auth/callback/route.ts: ${error}`, "error");
  }

  // 5. Vérifier les variables d'environnement
  log("\n5. Vérification des variables d'environnement", "cyan");
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
  ];

  const optionalEnvVars = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`   ✅ ${envVar}`, "green");
    } else {
      issues.push({ severity: "error", message: `Variable d'environnement manquante: ${envVar}` });
      logIssue(`Variable d'environnement manquante: ${envVar}`, "error");
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      log(`   ✅ ${envVar} (optionnel)`, "green");
    } else {
      issues.push({ severity: "warning", message: `Variable d'environnement optionnelle manquante: ${envVar}` });
      logIssue(`Variable d'environnement optionnelle manquante: ${envVar}`, "warning");
    }
  }

  // 6. Vérifier que Supabase Auth est utilisé correctement
  log("\n6. Vérification de l'utilisation de Supabase Auth", "cyan");
  try {
    const actionsContent = readFileSync("app/auth/actions.ts", "utf-8");
    
    if (actionsContent.includes("supabase.auth.signUp")) {
      log(`   ✅ signUp utilise Supabase Auth standard`, "green");
    } else {
      issues.push({ severity: "error", message: "signUp ne utilise pas Supabase Auth standard" });
      logIssue("signUp ne utilise pas Supabase Auth standard", "error");
    }

    if (actionsContent.includes("supabase.auth.resend")) {
      log(`   ✅ resendConfirmationEmail utilise Supabase Auth standard`, "green");
    } else {
      issues.push({ severity: "warning", message: "resendConfirmationEmail ne utilise pas Supabase Auth standard" });
      logIssue("resendConfirmationEmail ne utilise pas Supabase Auth standard", "warning");
    }
  } catch (error) {
    issues.push({ severity: "error", message: `Erreur lecture app/auth/actions.ts: ${error}` });
    logIssue(`Erreur lecture app/auth/actions.ts: ${error}`, "error");
  }

  // 7. Vérifier emails/verification-email.tsx (optionnel, peut être supprimé si non utilisé)
  log("\n7. Vérification du template d'email (optionnel)", "cyan");
  try {
    if (existsSync("emails/verification-email.tsx")) {
      log(`   ℹ️  Template d'email personnalisé présent (optionnel)`, "cyan");
    } else {
      log(`   ✅ Pas de template personnalisé (Supabase gère les emails via SMTP)`, "green");
    }
  } catch (_error) {
    // Ignorer, ce n'est pas critique
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  log("📊 RÉSUMÉ", "cyan");
  console.log("=".repeat(60));

  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  if (errors.length === 0 && warnings.length === 0) {
    log("\n✅ Aucun problème détecté !", "green");
    log("   Le parcours d'inscription semble correctement configuré.", "green");
  } else {
    if (errors.length > 0) {
      log(`\n❌ ${errors.length} erreur(s) critique(s) détectée(s):`, "red");
      errors.forEach(issue => log(`   - ${issue.message}`, "red"));
    }
    if (warnings.length > 0) {
      log(`\n⚠️  ${warnings.length} avertissement(s):`, "yellow");
      warnings.forEach(issue => log(`   - ${issue.message}`, "yellow"));
    }
  }

  if (infos.length > 0) {
    log(`\nℹ️  ${infos.length} information(s):`, "cyan");
    infos.forEach(issue => log(`   - ${issue.message}`, "cyan"));
  }

  console.log("\n" + "=".repeat(60));
  log("💡 Prochaines étapes:", "cyan");
  log("   1. Corrigez les erreurs critiques", "yellow");
  log("   2. Vérifiez les avertissements", "yellow");
  log("   3. Exécutez: npm run test:signup", "yellow");
  log("   4. Testez manuellement sur http://localhost:3000/register", "yellow");
  console.log("=".repeat(60) + "\n");

  process.exit(errors.length > 0 ? 1 : 0);
}

checkSignupIssues().catch((error) => {
  log(`\n❌ Erreur fatale: ${error}`, "red");
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

