/**
 * Script pour identifier et remplacer les images cassées par des images Pexels
 * Vérifie chaque image et remplace celles qui retournent 404 ou erreur
 * 
 * Usage: npm run fix-images
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });

const PEXELS_API_KEY = "3eFVqLX19mBYTUVCMxhpPH156xmJ8K5ccP5TBwH5R2h90pHMmgb638AS";
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
  console.error("\n💡 Pour les scripts de maintenance, vous DEVEZ utiliser SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Cette clé se trouve dans votre dashboard Supabase → Settings → API → service_role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined,
  },
});

// Mots-clés de recherche Pexels basés sur le type de bien
const getSearchQuery = (title: string, description: string, _type?: string): string => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("terrain") || text.includes("land")) {
    return "empty land plot construction";
  }
  if (text.includes("villa") || text.includes("maison") || text.includes("house")) {
    return "modern white villa exterior";
  }
  if (text.includes("appartement") || text.includes("apartment")) {
    return "modern apartment interior";
  }
  if (text.includes("studio")) {
    return "studio apartment interior design";
  }
  if (text.includes("bureau") || text.includes("office")) {
    return "modern office space";
  }
  if (text.includes("piscine") || text.includes("pool")) {
    return "luxury house with pool";
  }
  
  return "modern real estate property";
};

// Vérifier si une image est accessible
async function checkImageExists(url: string): Promise<boolean> {
  try {
    // Essayer d'abord avec HEAD (plus rapide)
    const headResponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    
    if (headResponse.ok && headResponse.status === 200) {
      // Vérifier aussi le Content-Type pour s'assurer que c'est bien une image
      const contentType = headResponse.headers.get("content-type");
      if (contentType && !contentType.startsWith("image/")) {
        console.log(`   ⚠️ URL ne pointe pas vers une image: ${contentType}`);
        return false;
      }
      return true;
    }
    
    // Si HEAD échoue, essayer GET avec un petit chunk pour vérifier
    const getResponse = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: {
        Range: "bytes=0-1024", // Récupérer seulement les premiers 1KB
      },
    });
    
    if (getResponse.ok) {
      const contentType = getResponse.headers.get("content-type");
      return contentType ? contentType.startsWith("image/") : true;
    }
    
    return false;
  } catch (_error) {
    // Si c'est une erreur de timeout ou réseau, considérer comme cassé
    return false;
  }
}

// Récupérer des images depuis Pexels
async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`   ⚠️ Erreur Pexels API: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const images = data.photos?.map((photo: any) => {
      const url = photo.src?.large || photo.src?.original || photo.src?.medium;
      if (url && typeof url === "string") {
        return url.startsWith("http") ? url : `https:${url}`;
      }
      return null;
    }).filter((url: string | null): url is string => url !== null && url.length > 0) || [];
    
    if (images.length > 0) {
      console.log(`   ✅ ${images.length} images Pexels trouvées`);
    }
    return images;
  } catch (error) {
    console.error(`   ❌ Erreur lors de la récupération des images Pexels:`, error);
    return [];
  }
}

// Identifier et remplacer les images cassées
async function fixBrokenImages() {
  console.log("🔍 Recherche des propriétés avec des images...");

  // Récupérer toutes les propriétés
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, description, images, details");

  if (error) {
    console.error("❌ Erreur lors de la récupération des propriétés:", error);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log("ℹ️ Aucune propriété trouvée");
    return;
  }

  console.log(`📦 ${properties.length} propriétés trouvées\n`);

  let updated = 0;
  let skipped = 0;
  let totalBroken = 0;

  for (const property of properties) {
    const images = property.images as string[] | null;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      skipped++;
      continue;
    }

    console.log(`\n🔄 Vérification: ${property.title}`);
    console.log(`   ${images.length} image(s) à vérifier`);

    // Vérifier chaque image
    const brokenIndices: number[] = [];
    const _imageChecks = await Promise.all(
      images.map(async (img, index) => {
        if (!img || typeof img !== "string" || img.length === 0) {
          brokenIndices.push(index);
          return false;
        }
        const exists = await checkImageExists(img);
        if (!exists) {
          brokenIndices.push(index);
          console.log(`   ❌ Image ${index + 1} cassée: ${img.substring(0, 60)}...`);
        }
        return exists;
      })
    );

    if (brokenIndices.length === 0) {
      console.log(`   ✅ Toutes les images sont valides`);
      skipped++;
      continue;
    }

    totalBroken += brokenIndices.length;
    console.log(`   ⚠️ ${brokenIndices.length} image(s) cassée(s) détectée(s)`);

    // Générer une requête de recherche basée sur le bien
    const searchQuery = getSearchQuery(
      property.title || "",
      property.description || "",
      (property.details as any)?.type
    );

    console.log(`   🔍 Recherche Pexels: "${searchQuery}"`);

    // Récupérer de nouvelles images depuis Pexels
    const newImages = await fetchPexelsImages(searchQuery, brokenIndices.length);

    if (newImages.length === 0) {
      console.log(`   ⚠️ Aucune image Pexels trouvée, conservation des images existantes`);
      skipped++;
      continue;
    }

    // Remplacer les images cassées par les nouvelles images Pexels
    const updatedImages = images.map((img, index) => {
      if (brokenIndices.includes(index)) {
        const pexelsImage = newImages[brokenIndices.indexOf(index) % newImages.length];
        if (pexelsImage) {
          console.log(`   ✅ Remplacement image ${index + 1} par Pexels`);
          return pexelsImage;
        }
      }
      return img;
    }).filter((img) => img && typeof img === "string" && img.length > 0);

    // Mettre à jour dans Supabase
    const { error: updateError } = await supabase
      .from("properties")
      .update({ images: updatedImages })
      .eq("id", property.id);

    if (updateError) {
      console.error(`   ❌ Erreur lors de la mise à jour:`, updateError);
    } else {
      console.log(`   ✅ ${brokenIndices.length} image(s) remplacée(s)`);
      updated++;
    }

    // Attendre un peu pour éviter de surcharger l'API Pexels
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✨ Terminé!`);
  console.log(`   📊 ${updated} propriétés mises à jour`);
  console.log(`   📊 ${totalBroken} image(s) cassée(s) remplacée(s)`);
  console.log(`   ⏭️  ${skipped} propriétés ignorées (pas d'images cassées)`);
}

// Exécuter le script
fixBrokenImages()
  .then(() => {
    console.log("\n🎉 Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });

