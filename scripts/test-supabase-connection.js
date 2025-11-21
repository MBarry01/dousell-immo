/**
 * Script de test pour vérifier la connexion à Supabase
 * Usage: node scripts/test-supabase-connection.js
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Vérification de la connexion Supabase...\n");

// Vérifier les variables d'environnement
if (!supabaseUrl) {
  console.error("❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL n'est pas défini dans .env.local");
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error("❌ ERREUR: NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas défini dans .env.local");
  process.exit(1);
}

console.log("✅ Variables d'environnement trouvées:");
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`);

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tester la connexion
async function testConnection() {
  try {
    console.log("🔄 Test de connexion à Supabase...\n");

    // Test 1: Vérifier que la table properties existe
    console.log("1️⃣ Test: Vérification de la table 'properties'...");
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id")
      .limit(1);

    if (propertiesError) {
      console.error(`   ❌ Erreur: ${propertiesError.message}`);
      console.error(`   Code: ${propertiesError.code}`);
      console.error(`   Détails: ${JSON.stringify(propertiesError, null, 2)}`);
      return false;
    }

    console.log(`   ✅ Table 'properties' accessible (${properties?.length || 0} résultat(s))\n`);

    // Test 2: Vérifier l'authentification
    console.log("2️⃣ Test: Vérification de l'authentification...");
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log(`   ⚠️  Aucune session active (normal si non connecté)`);
    } else {
      console.log(`   ✅ Service d'authentification opérationnel`);
    }
    console.log();

    // Test 3: Vérifier le storage
    console.log("3️⃣ Test: Vérification du storage 'properties'...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error(`   ❌ Erreur: ${bucketsError.message}`);
    } else {
      const propertiesBucket = buckets?.find((b) => b.name === "properties");
      if (propertiesBucket) {
        console.log(`   ✅ Bucket 'properties' trouvé`);
      } else {
        console.log(`   ⚠️  Bucket 'properties' non trouvé (peut être créé plus tard)`);
      }
    }
    console.log();

    console.log("✅ Tous les tests sont passés ! La connexion Supabase fonctionne.\n");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
    console.error(error);
    return false;
  }
}

// Exécuter les tests
testConnection()
  .then((success) => {
    if (success) {
      console.log("🎉 Connexion Supabase validée !");
      process.exit(0);
    } else {
      console.log("❌ Des erreurs ont été détectées. Vérifiez votre configuration.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });

