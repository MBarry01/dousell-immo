/**
 * Script pour mettre à jour les coordonnées GPS des annonces existantes
 * Usage: npx tsx scripts/update-coordinates.ts
 * 
 * Utilise smartGeocode pour garantir qu'on trouve toujours des coordonnées
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Les variables d'environnement Supabase sont manquantes.");
  process.exit(1);
}

// Créer un client Supabase avec les droits admin (service role)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Importer smartGeocode (on doit utiliser une version compatible avec le script)
// Pour éviter les problèmes d'import ESM/CJS, on va recréer la logique ici
import { findInDictionary, DEFAULT_COORDINATES } from "../constants/coordinates";

// Version améliorée du géocodage avec retry automatique
async function getCoordinates(query: string, retries: number = 2): Promise<{ lat: number; lng: number } | null> {
  if (!query || !query.trim()) return null;

  const cleanQuery = query.trim().replace(/\s+/g, " ").replace(/,\s*$/, "").replace(/,\s*Sénégal\s*$/i, ", Sénégal");
  
  if (cleanQuery.length < 3 || cleanQuery.toLowerCase() === "sénégal") return null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery
      )}&countrycodes=sn&limit=1&addressdetails=1`;

      const headers = {
        "User-Agent": "Dousel-Immo-Script/1.0",
        "Accept-Language": "fr",
      };

      const response = await fetch(url, { headers });

      if (response.status === 429) {
        const waitTime = (attempt + 1) * 2000;
        console.warn(`   ⚠️ Rate limit, attente ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng) && lat >= 12.0 && lat <= 16.7 && lng >= -17.5 && lng <= -11.3) {
          return { lat, lng };
        }
      }

      // Si aucun résultat et qu'on a encore des tentatives, simplifier la requête
      if (attempt < retries && cleanQuery.includes(",")) {
        const parts = cleanQuery.split(",");
        if (parts.length > 1) {
          const simplified = parts.slice(-2).join(",").trim();
          if (simplified !== cleanQuery) {
            console.log(`   🔄 Réessai avec: ${simplified}`);
            return getCoordinates(simplified, retries - attempt - 1);
          }
        }
      }

      return null;
    } catch (_error) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Géocodage intelligent par "Triangulation" - GARANTIT toujours un résultat
 * Version locale pour le script (utilise findInDictionary importé)
 */
async function smartGeocodeLocal(
  address?: string,
  district?: string,
  city?: string
): Promise<{ lat: number; lng: number }> {
  const cleanAddress = address?.trim() || "";
  const cleanDistrict = district?.trim() || "";
  const cleanCity = city?.trim() || "";

  // Niveau 1 : Adresse complète
  if (cleanAddress && cleanDistrict && cleanCity) {
    const cleanAddr = cleanAddress.split(',')[0].split(' - ')[0].substring(0, 50);
    const fullQuery = `${cleanAddr}, ${cleanDistrict}, ${cleanCity}, Sénégal`;
    const result = await getCoordinates(fullQuery, 1);
    if (result) {
      console.log(`   ✅ Niveau 1 (adresse complète)`);
      return result;
    }
  }

  // Niveau 2 : Quartier + Ville
  if (cleanDistrict && cleanCity) {
    const districtQuery = `${cleanDistrict}, ${cleanCity}, Sénégal`;
    const result = await getCoordinates(districtQuery, 1);
    if (result) {
      console.log(`   ✅ Niveau 2 (quartier + ville)`);
      return result;
    }
  }

  // Niveau 3 : Ville seule
  if (cleanCity) {
    const cityQuery = `${cleanCity}, Sénégal`;
    const result = await getCoordinates(cityQuery, 1);
    if (result) {
      console.log(`   ✅ Niveau 3 (ville)`);
      return result;
    }
  }

  // Niveau 4 : Dictionnaire local (avec correspondance approximative)
  if (cleanCity) {
    const dictResult = findInDictionary(cleanCity);
    if (dictResult) {
      console.log(`   ✅ Niveau 4 (dictionnaire - ville: ${cleanCity})`);
      return dictResult;
    }
  }

  if (cleanDistrict) {
    const dictResult = findInDictionary(cleanDistrict);
    if (dictResult) {
      console.log(`   ✅ Niveau 4 (dictionnaire - quartier: ${cleanDistrict})`);
      return dictResult;
    }
  }

  // Niveau 5 : Fallback absolu - Dakar
  console.warn(`   ⚠️  Fallback absolu (Dakar) pour: ${cleanAddress}, ${cleanDistrict}, ${cleanCity}`);
  return DEFAULT_COORDINATES;
}

async function main() {
  console.log("🚀 Démarrage de la mise à jour des coordonnées (smartGeocode - garantit toujours un résultat)...");

  // 1. Récupérer toutes les propriétés
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, location");

  if (error) {
    console.error("❌ Erreur lors de la récupération des propriétés:", error);
    return;
  }

  console.log(`📦 ${properties.length} propriétés trouvées.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // 2. Itérer sur chaque propriété
  for (const property of properties) {
    const location = property.location;
    
    // Vérifier si les coordonnées sont valides (non nulles)
    const currentLat = location?.coords?.lat || 0;
    const currentLng = location?.coords?.lng || 0;
    
    // On ne saute que si on a déjà des coordonnées valides ET qu'on ne force pas le refresh
    // Ici on re-scan tout pour être sûr
    // const hasValidCoords = currentLat !== 0 && currentLng !== 0;
    // if (hasValidCoords) { ... }

    console.log(`\n📍 Traitement de : ${property.title} (${property.id})`);
    console.log(`   Actuel : ${currentLat}, ${currentLng}`);
    
    const city = location?.city || "";
    const district = location?.district || "";
    const address = location?.address || "";

    // Utiliser smartGeocode (version locale dans le script)
    // Cette fonction garantit TOUJOURS un résultat
    const coords = await smartGeocodeLocal(address, district, city);
    
    // smartGeocode garantit TOUJOURS un résultat, donc coords n'est jamais null
    const isDifferent = Math.abs(coords.lat - currentLat) > 0.0001 || Math.abs(coords.lng - currentLng) > 0.0001;
    
    // Si on était à 0,0 c'est forcément différent et on veut update
    if (isDifferent) {
      const updatedLocation = {
        ...location,
        coords: {
          lat: coords.lat,
          lng: coords.lng
        }
      };

      const { error: updateError } = await supabase
        .from("properties")
        .update({ location: updatedLocation })
        .eq("id", property.id);

      if (updateError) {
        console.error(`   ❌ Erreur update : ${updateError.message}`);
        failedCount++;
      } else {
        console.log(`   ✅ Mis à jour : ${coords.lat}, ${coords.lng}`);
        updatedCount++;
      }
    } else {
      console.log("   ⏭️  Identique, pas de mise à jour.");
      skippedCount++;
    }

    // Pause pour respecter le rate limiting de Nominatim (1 req/s recommandé)
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log("\n\n🎉 Terminé !");
  console.log(`- Mis à jour : ${updatedCount}`);
  console.log(`- Ignorés (déjà valides) : ${skippedCount}`);
  console.log(`- Échecs : ${failedCount}`);
}

main();
