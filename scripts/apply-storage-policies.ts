/**
 * Script pour appliquer les Storage Policies (RLS) via l'API Supabase
 * Alternative à `supabase db push` quand le CLI n'est pas configuré
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLMigration(sqlContent: string) {
  // L'API Supabase JavaScript ne permet pas d'exécuter du SQL arbitraire
  // On doit utiliser l'API REST de Supabase (postgres-meta)

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: sqlContent
  });

  if (error) {
    // Si la fonction RPC n'existe pas, on utilise une autre méthode
    console.error("❌ Impossible d'exécuter le SQL via RPC");
    console.error("Erreur:", error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log("🔧 Application des Storage Policies pour verification-docs\n");

  // Lire le fichier de migration
  const migrationPath = join(
    process.cwd(),
    "supabase",
    "migrations",
    "20250101_storage_policies_verification_docs.sql"
  );

  let sqlContent: string;
  try {
    sqlContent = readFileSync(migrationPath, "utf-8");
    console.log("✅ Migration SQL chargée:", migrationPath);
  } catch (error) {
    console.error("❌ Impossible de lire le fichier de migration");
    console.error(error);
    process.exit(1);
  }

  console.log("\n📝 Contenu de la migration:\n");
  console.log("=".repeat(80));
  console.log(sqlContent);
  console.log("=".repeat(80));

  console.log("\n⚠️  IMPORTANT: L'API Supabase JavaScript ne permet pas d'exécuter du SQL directement.");
  console.log("📋 Veuillez suivre ces étapes manuellement:\n");

  console.log("1️⃣ Ouvrir le Dashboard Supabase:");
  console.log("   " + supabaseUrl.replace("/rest/v1", ""));
  console.log("\n2️⃣ Aller dans 'SQL Editor'");
  console.log("\n3️⃣ Créer une 'New Query'");
  console.log("\n4️⃣ Copier-coller le contenu de la migration (affiché ci-dessus)");
  console.log("\n5️⃣ Cliquer sur 'Run' (ou F5)");
  console.log("\n6️⃣ Vérifier que les 3 policies sont créées avec succès\n");

  console.log("✨ Ou utilisez cette commande si vous préférez copier depuis le fichier:");
  console.log(`   cat "${migrationPath}" | pbcopy   # macOS`);
  console.log(`   cat "${migrationPath}" | xclip -selection clipboard   # Linux`);
  console.log(`   Get-Content "${migrationPath}" | Set-Clipboard   # Windows PowerShell\n`);

  // Alternative: Afficher les commandes individuelles
  console.log("\n💡 Alternative: Exécuter les commandes une par une:\n");

  const policies = [
    {
      name: "Users can upload to own folder",
      operation: "INSERT",
      sql: `
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);`
    },
    {
      name: "Users can view own files or admins can view all",
      operation: "SELECT",
      sql: `
CREATE POLICY "Users can view own files or admins can view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  )
);`
    },
    {
      name: "Users can delete own files",
      operation: "DELETE",
      sql: `
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);`
    }
  ];

  policies.forEach((policy, index) => {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`POLICY ${index + 1}: ${policy.name} (${policy.operation})`);
    console.log("─".repeat(80));
    console.log(policy.sql);
  });

  console.log("\n\n✅ Une fois les policies créées, testez l'upload depuis l'interface web!");
  console.log("🔍 Pour vérifier: Storage > verification-docs > Policies\n");
}

main().catch(console.error);
