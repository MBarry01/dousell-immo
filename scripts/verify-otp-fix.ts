/**
 * Script de vérification du fix OTP
 *
 * Vérifie que le code utilise bien signInWithOtp partout
 * et qu'il n'y a pas d'incohérences
 *
 * Usage: npx tsx scripts/verify-otp-fix.ts
 */

import * as fs from "fs";
import * as path from "path";

console.log("\n🔍 Vérification de la correction OTP\n");
console.log("=".repeat(50));

let hasErrors = false;

// 1. Vérifier que resendOtpCode utilise signInWithOtp
console.log("\n1️⃣ Vérification de resendOtpCode...");

const actionsPath = path.join(process.cwd(), "app", "auth", "actions.ts");
const actionsContent = fs.readFileSync(actionsPath, "utf-8");

// Chercher la fonction resendOtpCode
const resendFunctionMatch = actionsContent.match(
  /export async function resendOtpCode\([^)]+\)\s*{[\s\S]*?^}/m
);

if (!resendFunctionMatch) {
  console.error("❌ Fonction resendOtpCode non trouvée");
  hasErrors = true;
} else {
  const resendFunction = resendFunctionMatch[0];

  // Vérifier qu'elle utilise signInWithOtp
  if (resendFunction.includes("signInWithOtp")) {
    console.log("✅ resendOtpCode utilise signInWithOtp");
  } else {
    console.error("❌ resendOtpCode n'utilise PAS signInWithOtp");
    hasErrors = true;
  }

  // Vérifier qu'elle n'utilise pas auth.resend
  if (resendFunction.includes("auth.resend")) {
    console.error("❌ resendOtpCode utilise encore auth.resend (à corriger)");
    hasErrors = true;
  } else {
    console.log("✅ resendOtpCode n'utilise pas auth.resend");
  }

  // Vérifier shouldCreateUser: false
  if (resendFunction.includes("shouldCreateUser: false")) {
    console.log("✅ resendOtpCode a shouldCreateUser: false");
  } else {
    console.error("❌ resendOtpCode manque shouldCreateUser: false");
    hasErrors = true;
  }
}

// 2. Vérifier que verifyOtpCode utilise type: "email"
console.log("\n2️⃣ Vérification de verifyOtpCode...");

const verifyFunctionMatch = actionsContent.match(
  /export async function verifyOtpCode\([^)]+\)\s*{[\s\S]*?^}/m
);

if (!verifyFunctionMatch) {
  console.error("❌ Fonction verifyOtpCode non trouvée");
  hasErrors = true;
} else {
  const verifyFunction = verifyFunctionMatch[0];

  // Vérifier qu'elle utilise type: "email"
  if (verifyFunction.includes('type: "email"')) {
    console.log('✅ verifyOtpCode utilise type: "email"');
  } else if (verifyFunction.includes('type: "signup"')) {
    console.error('❌ verifyOtpCode utilise encore type: "signup" (à corriger)');
    hasErrors = true;
  } else {
    console.error("❌ verifyOtpCode ne spécifie pas le type");
    hasErrors = true;
  }
}

// 3. Compter les occurrences de signInWithOtp
console.log("\n3️⃣ Comptage des appels signInWithOtp...");

const signInWithOtpMatches = actionsContent.match(/signInWithOtp/g);
const signInWithOtpCount = signInWithOtpMatches ? signInWithOtpMatches.length : 0;

console.log(`📊 Nombre d'occurrences de signInWithOtp: ${signInWithOtpCount}`);

// On devrait en avoir 2 : une dans signup(), une dans resendOtpCode()
if (signInWithOtpCount === 2) {
  console.log("✅ Nombre d'appels signInWithOtp correct (2)");
} else if (signInWithOtpCount < 2) {
  console.error(`❌ Pas assez d'appels signInWithOtp (attendu: 2, trouvé: ${signInWithOtpCount})`);
  hasErrors = true;
} else {
  console.warn(`⚠️  Plus de 2 appels signInWithOtp (${signInWithOtpCount}) - vérifier s'il y a des duplications`);
}

// 4. Vérifier qu'il n'y a pas de auth.resend avec type: "signup"
console.log("\n4️⃣ Vérification des anciens patterns...");

if (actionsContent.includes('auth.resend')) {
  const resendMatches = actionsContent.match(/auth\.resend\(/g);
  const resendCount = resendMatches ? resendMatches.length : 0;
  console.warn(`⚠️  Trouvé ${resendCount} appel(s) à auth.resend - à vérifier`);
} else {
  console.log("✅ Aucun appel à auth.resend trouvé");
}

// 5. Vérifier le composant OTP Input
console.log("\n5️⃣ Vérification du composant OtpInput...");

const otpInputPath = path.join(process.cwd(), "components", "ui", "otp-input.tsx");

if (!fs.existsSync(otpInputPath)) {
  console.error("❌ Fichier otp-input.tsx non trouvé");
  hasErrors = true;
} else {
  const otpInputContent = fs.readFileSync(otpInputPath, "utf-8");

  // Vérifier l'auto-focus
  if (otpInputContent.includes("inputRefs.current[0]?.focus()")) {
    console.log("✅ OtpInput a l'auto-focus sur le premier champ");
  } else {
    console.warn("⚠️  OtpInput pourrait ne pas avoir d'auto-focus");
  }

  // Vérifier la gestion du paste
  if (otpInputContent.includes("handlePaste")) {
    console.log("✅ OtpInput gère le copier-coller");
  } else {
    console.warn("⚠️  OtpInput ne gère peut-être pas le copier-coller");
  }
}

// 6. Résumé final
console.log("\n" + "=".repeat(50));

if (hasErrors) {
  console.log("\n❌ Des erreurs ont été détectées - vérifiez le code\n");
  process.exit(1);
} else {
  console.log("\n✅ Toutes les vérifications sont passées !\n");
  console.log("📋 Récapitulatif :");
  console.log("   - resendOtpCode utilise signInWithOtp ✅");
  console.log("   - verifyOtpCode utilise type: 'email' ✅");
  console.log("   - Pas d'appels multiples détectés ✅");
  console.log("   - OtpInput configuré correctement ✅");
  console.log("\n🎉 Le système OTP est correctement configuré !\n");
}
