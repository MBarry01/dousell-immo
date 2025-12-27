/**
 * Script pour corriger les coordonnées de l'annonce de Touba
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { smartGeocode } from "../lib/geocoding";

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTouba() {
  console.log("🔍 Recherche et correction de l'annonce de Touba...\n");

  // Rechercher l'annonce de Touba
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, location")
    .or("location->>city.ilike.%Touba%,location->>address.ilike.%Touba%");

  if (error) {
    console.error("❌ Erreur Supabase:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("ℹ️ Aucune annonce trouvée pour Touba");
    return;
  }

  for (const property of data) {
    const location = property.location as any;
    const currentCoords = location?.coords || { lat: 0, lng: 0 };
    const address = location?.address || "";
    const district = location?.district || "";
    const city = location?.city || "";

    console.log(`📋 Traitement: ${property.title}`);
    console.log(`   Adresse actuelle: ${address}`);
    console.log(`   Quartier: ${district}`);
    console.log(`   Ville: ${city}`);
    console.log(`   Coordonnées actuelles: ${currentCoords.lat}, ${currentCoords.lng}`);

    // Utiliser smartGeocode pour obtenir les bonnes coordonnées
    // Si la ville est "Kafrine" mais l'adresse est "Touba", on doit corriger
    const geocodeAddress = address;
    const geocodeDistrict = district;
    let geocodeCity = city;

    // Si l'adresse est "Touba" mais la ville est "Kafrine", on corrige la ville
    if (address.toLowerCase().includes("touba") && city.toLowerCase().includes("kafrine")) {
      console.log("   ⚠️ Détection: Adresse = Touba mais Ville = Kafrine (incorrect)");
      console.log("   ✅ Correction: Utilisation de 'Touba' comme ville");
      geocodeCity = "Touba";
    }

    console.log(`\n   🔄 Géocodage avec: address="${geocodeAddress}", district="${geocodeDistrict}", city="${geocodeCity}"`);

    const newCoords = await smartGeocode(geocodeAddress, geocodeDistrict, geocodeCity);

    console.log(`   ✅ Nouvelles coordonnées: ${newCoords.lat}, ${newCoords.lng}`);

    // Mettre à jour dans Supabase
    const updatedLocation = {
      ...location,
      coords: newCoords,
      // Corriger aussi la ville si nécessaire
      city: geocodeCity !== city ? geocodeCity : city,
    };

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        location: updatedLocation,
      })
      .eq("id", property.id);

    if (updateError) {
      console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`);
    } else {
      console.log(`   ✅ Coordonnées mises à jour avec succès !\n`);
    }
  }
}

fixTouba()
  .then(() => {
    console.log("✅ Correction terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });










