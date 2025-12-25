/**
 * Script pour créer les Storage Policies (RLS) sur le bucket verification-docs
 * À exécuter APRÈS avoir créé le bucket dans le Dashboard Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🔧 Configuration des Storage Policies pour verification-docs\n");

  // Les policies doivent être créées via SQL car l'API Supabase ne permet pas
  // de créer des policies directement
  console.log("📝 Exécutez les commandes SQL suivantes dans le Dashboard Supabase:");
  console.log("   Storage > verification-docs > Policies > New Policy\n");

  console.log("=" + "=".repeat(79));
  console.log("POLICY 1: Upload (INSERT)");
  console.log("=" + "=".repeat(79));
  console.log(`
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
  `);

  console.log("=" + "=".repeat(79));
  console.log("POLICY 2: Téléchargement/Lecture (SELECT)");
  console.log("=" + "=".repeat(79));
  console.log(`
CREATE POLICY "Users can view own files or admins can view all"
ON storage.objects
FOR SELECT
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
);
  `);

  console.log("=" + "=".repeat(79));
  console.log("POLICY 3: Suppression (DELETE)");
  console.log("=" + "=".repeat(79));
  console.log(`
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
  `);

  console.log("\n" + "=".repeat(80));
  console.log("📋 INSTRUCTIONS");
  console.log("=".repeat(80));
  console.log("1. Allez dans le Dashboard Supabase");
  console.log("2. Storage > verification-docs > Policies");
  console.log("3. Cliquez sur 'New Policy'");
  console.log("4. Copiez-collez chaque policy ci-dessus (3 policies au total)");
  console.log("5. Cliquez sur 'Save' pour chaque policy");
  console.log("\n✅ Une fois fait, testez l'upload depuis l'interface web!");
  console.log("\n");
}

main().catch(console.error);
