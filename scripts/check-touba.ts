/**
 * Script pour vérifier les annonces de Touba et leurs coordonnées
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTouba() {
  console.log("🔍 Recherche des annonces pour Touba...\n");

  // Rechercher toutes les annonces contenant "Touba" dans la ville
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, location, validation_status, status")
    .or("location->>city.ilike.%Touba%,location->>address.ilike.%Touba%");

  if (error) {
    console.error("❌ Erreur Supabase:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("ℹ️ Aucune annonce trouvée pour Touba");
    return;
  }

  console.log(`✅ ${data.length} annonce(s) trouvée(s) pour Touba:\n`);

  for (const property of data) {
    const location = property.location as any;
    const coords = location?.coords || { lat: 0, lng: 0 };
    const city = location?.city || "N/A";
    const address = location?.address || "N/A";

    console.log(`📋 ${property.title}`);
    console.log(`   ID: ${property.id}`);
    console.log(`   Ville: ${city}`);
    console.log(`   Adresse: ${address}`);
    console.log(
      `   Coordonnées: ${coords.lat}, ${coords.lng} ${
        coords.lat === 0 && coords.lng === 0 ? "❌ (0,0 - INVALIDE)" : ""
      }`
    );
    console.log(
      `   Statut: ${property.validation_status} / ${property.status}`
    );
    console.log("");
  }
}

checkTouba()
  .then(() => {
    console.log("✅ Vérification terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });









