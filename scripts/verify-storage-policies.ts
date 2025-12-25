/**
 * Script pour vérifier que les Storage Policies sont bien appliquées
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
  console.log("🔍 Vérification des Storage Policies pour verification-docs\n");

  // Requête pour lister les policies sur storage.objects
  const { data: policies, error } = await supabase.rpc("exec_sql", {
    sql: `
      SELECT
        polname as policy_name,
        polcmd as policy_command,
        CASE polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          ELSE 'ALL'
        END as operation
      FROM pg_policy
      WHERE polrelid = 'storage.objects'::regclass
      AND polname LIKE '%verification-docs%' OR polname LIKE '%Users can%'
      ORDER BY polname;
    `,
  }) as any;

  if (error) {
    console.log("⚠️  Impossible de lister les policies via RPC");
    console.log("   Vérification manuelle requise dans le Dashboard Supabase\n");

    console.log("📝 Pour vérifier manuellement:");
    console.log("   1. Ouvrir: " + supabaseUrl.replace("/rest/v1", "") + "/storage/buckets/verification-docs");
    console.log("   2. Cliquer sur 'Policies'");
    console.log("   3. Vérifier que vous voyez ces 3 policies:\n");

    console.log("   ✅ Policy 1: 'Users can upload to own folder' (INSERT)");
    console.log("   ✅ Policy 2: 'Users can view own files or admins can view all' (SELECT)");
    console.log("   ✅ Policy 3: 'Users can delete own files' (DELETE)\n");

    return;
  }

  console.log("✅ Policies trouvées:\n");
  policies.forEach((policy: any) => {
    console.log(`   - ${policy.policy_name} (${policy.operation})`);
  });

  console.log("\n🎯 Prochaine étape:");
  console.log("   Testez l'upload depuis l'interface web:");
  console.log("   1. Connectez-vous à Dousell Immo");
  console.log("   2. Allez dans 'Compte' > 'Mes Documents'");
  console.log("   3. Cliquez sur 'Ajouter un document'");
  console.log("   4. Uploadez un PDF ou une image (< 5 MB)");
  console.log("   5. ✅ Le document devrait apparaître dans la liste\n");
}

main().catch(console.error);
