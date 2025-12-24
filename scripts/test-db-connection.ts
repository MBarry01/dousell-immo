import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Charger les variables d'environnement
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Test de connexion à Supabase...\n");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

console.log("📋 Configuration:");
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
console.log("");

// Créer le client Supabase avec la clé service (accès complet)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Récupérer les tables du schéma public
    console.log("📊 Test 1: Récupération de la liste des tables publiques...");

    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name");

    if (tablesError) {
      // Si information_schema n'est pas accessible, on teste avec une table connue
      console.log("⚠️  information_schema non accessible, test avec une table connue...");

      const { count, error: propertiesError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      if (propertiesError) {
        throw new Error(`Erreur lors du test sur 'properties': ${propertiesError.message}`);
      }

      console.log("✅ Connexion réussie !");
      console.log(`   Table 'properties' accessible (${count} entrées)`);

      // Essayer d'autres tables communes
      const commonTables = ["users", "user_roles", "notifications", "reviews", "visit_requests"];
      console.log("\n📋 Test des tables principales:");

      for (const tableName of commonTables) {
        try {
          const { count: tableCount, error } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          if (!error) {
            console.log(`   ✓ ${tableName.padEnd(20)} - ${tableCount} entrées`);
          }
        } catch (err) {
          console.log(`   ✗ ${tableName.padEnd(20)} - non accessible`);
        }
      }
    } else {
      console.log("✅ Connexion réussie !");
      console.log(`\n📋 Tables publiques trouvées (${tables?.length || 0}):`);

      if (tables && tables.length > 0) {
        tables.forEach((table: { table_name: string }) => {
          console.log(`   - ${table.table_name}`);
        });

        // Test de comptage sur chaque table
        console.log("\n📊 Nombre d'entrées par table:");
        for (const table of tables) {
          try {
            const { count, error } = await supabase
              .from(table.table_name)
              .select("*", { count: "exact", head: true });

            if (!error) {
              console.log(`   ${table.table_name.padEnd(30)} - ${count} entrées`);
            }
          } catch (err) {
            console.log(`   ${table.table_name.padEnd(30)} - erreur`);
          }
        }
      } else {
        console.log("   Aucune table trouvée dans le schéma public");
      }
    }

    console.log("\n🎉 Base de données opérationnelle !");
    return true;

  } catch (error) {
    console.error("\n❌ Erreur lors du test de connexion:");
    console.error("   ", error instanceof Error ? error.message : String(error));
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("💥 Erreur fatale:", err);
    process.exit(1);
  });
