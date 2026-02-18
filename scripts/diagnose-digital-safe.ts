/**
 * Script de diagnostic pour le Digital Safe
 * Vérifie l'état de la configuration Supabase (table, bucket, policies)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🔍 Diagnostic du Digital Safe\n");

  // 1. Vérifier si la table user_documents existe
  console.log("1️⃣ Vérification de la table 'user_documents'...");
  const { data: _tableData, error: tableError } = await supabase
    .from("user_documents")
    .select("*", { count: "exact", head: true });

  if (tableError) {
    console.error("   ❌ Table 'user_documents' n'existe pas");
    console.error("   Erreur:", tableError.message);
    console.log("\n   👉 Solution: Exécuter la migration SQL");
    console.log("      Option 1 (Dashboard): Aller dans SQL Editor > Coller le contenu de migrations/20250101_digital_safe.sql");
    console.log("      Option 2 (CLI): cd supabase && npx supabase db push\n");
  } else {
    console.log("   ✅ Table 'user_documents' existe");
  }

  // 2. Vérifier si le bucket verification-docs existe
  console.log("\n2️⃣ Vérification du bucket 'verification-docs'...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("   ❌ Impossible de lister les buckets");
    console.error("   Erreur:", bucketsError.message);
  } else {
    const verificationBucket = buckets.find((b) => b.id === "verification-docs");
    if (verificationBucket) {
      console.log("   ✅ Bucket 'verification-docs' existe");
      console.log("      - Public:", verificationBucket.public ? "Oui ⚠️" : "Non (Privé) ✅");
      console.log("      - Created:", new Date(verificationBucket.created_at).toLocaleDateString());
    } else {
      console.error("   ❌ Bucket 'verification-docs' n'existe pas");
      console.log("\n   👉 Solution: Créer le bucket dans le Dashboard Supabase");
      console.log("      Storage > New Bucket:");
      console.log("      - Name: verification-docs");
      console.log("      - Public: NON (Privé)");
      console.log("      - File size limit: 5242880 (5 MB)");
      console.log("      - Allowed MIME types: application/pdf, image/jpeg, image/png\n");
    }
  }

  // 3. Tester un upload simple (si le bucket existe)
  const verificationBucket = buckets?.find((b) => b.id === "verification-docs");
  if (verificationBucket) {
    console.log("\n3️⃣ Test d'upload dans le bucket...");
    const testFileName = `test/diagnostic_${Date.now()}.txt`;
    const testContent = "Test Digital Safe";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("verification-docs")
      .upload(testFileName, testContent, {
        contentType: "text/plain",
      });

    if (uploadError) {
      console.error("   ❌ Upload échoué");
      console.error("   Erreur:", uploadError.message);
      console.log("\n   👉 Possible causes:");
      console.log("      - Storage Policies (RLS) non configurées");
      console.log("      - Permissions insuffisantes");
    } else {
      console.log("   ✅ Upload réussi");
      console.log("      - Path:", uploadData.path);

      // Nettoyer le fichier de test
      await supabase.storage.from("verification-docs").remove([testFileName]);
      console.log("      - Fichier de test supprimé");
    }
  }

  // 4. Vérifier les documents de certification (ad_verifications)
  console.log("\n4️⃣ Vérification de la table 'ad_verifications'...");
  const { data: _verifications, error: verificationsError } = await supabase
    .from("ad_verifications")
    .select("*", { count: "exact", head: true });

  if (verificationsError) {
    console.error("   ❌ Table 'ad_verifications' n'existe pas ou erreur");
    console.error("   Erreur:", verificationsError.message);
  } else {
    console.log("   ✅ Table 'ad_verifications' existe");
  }

  // Récapitulatif
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉCAPITULATIF");
  console.log("=".repeat(60));

  const allGood = !tableError && verificationBucket && !verificationsError;

  if (allGood) {
    console.log("✅ Tous les composants du Digital Safe sont opérationnels!");
    console.log("\n👉 Prochaines étapes:");
    console.log("   1. Configurer les Storage Policies (RLS) si pas déjà fait");
    console.log("   2. Tester l'upload depuis l'interface web");
  } else {
    console.log("⚠️  Configuration incomplète. Suivez les solutions ci-dessus.");
  }

  console.log("\n");
}

main().catch(console.error);
