/**
 * Script pour remplacer les images Unsplash cassées par des images Pexels
 * Utilise l'API Pexels pour générer de nouvelles images basées sur le type de bien
 * 
 * Usage: npm run replace-images
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });

const PEXELS_API_KEY = "3eFVqLX19mBYTUVCMxhpPH156xmJ8K5ccP5TBwH5R2h90pHMmgb638AS";
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Pour les scripts de maintenance, on DOIT utiliser la service role key pour bypasser RLS
// L'anon key ne fonctionnera pas car elle nécessite une session d'authentification
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ Variable d'environnement manquante: NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!supabaseKey) {
  console.error("❌ Variable d'environnement manquante: SUPABASE_SERVICE_ROLE_KEY");
  console.error("\n💡 Pour les scripts de maintenance, vous DEVEZ utiliser SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Cette clé se trouve dans votre dashboard Supabase → Settings → API → service_role key");
  process.exit(1);
}

// Créer le client avec la service role key pour bypasser RLS
// Configuration pour un script de maintenance (pas d'auth nécessaire)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined, // Désactiver le stockage de session
  },
});

// Mots-clés de recherche Pexels basés sur le type de bien
const getSearchQuery = (title: string, description: string, type?: string): string => {
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

// Récupérer des images depuis Pexels
async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Erreur Pexels API: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    // Utiliser les URLs Pexels directement (format: https://images.pexels.com/photos/...)
    const images = data.photos?.map((photo: any) => {
      // Préférer 'large' pour une bonne qualité sans être trop lourd
      // Format attendu: https://images.pexels.com/photos/ID/pexels-photo-ID.jpeg?auto=compress&cs=tinysrgb&w=1260
      const url = photo.src?.large || photo.src?.original || photo.src?.medium;
      if (url && typeof url === 'string') {
        // S'assurer que l'URL est complète
        return url.startsWith('http') ? url : `https:${url}`;
      }
      return null;
    }).filter((url: string | null): url is string => url !== null && url.length > 0) || [];
    
    if (images.length > 0) {
      console.log(`   ✅ ${images.length} images Pexels trouvées`);
    }
    return images;
  } catch (error) {
    console.error(`Erreur lors de la récupération des images Pexels:`, error);
    return [];
  }
}

// Remplacer les images Unsplash par des images Pexels
async function replaceUnsplashImages() {
  console.log("🔍 Recherche des propriétés avec des images Unsplash...");

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

  console.log(`📦 ${properties.length} propriétés trouvées`);

  let updated = 0;
  let skipped = 0;

  for (const property of properties) {
    const images = property.images as string[] | null;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      skipped++;
      continue;
    }

    // Vérifier si des images Unsplash sont présentes
    const hasUnsplash = images.some((img) => 
      typeof img === "string" && img.includes("unsplash.com")
    );

    if (!hasUnsplash) {
      skipped++;
      continue;
    }

    console.log(`\n🔄 Traitement de: ${property.title}`);

    // Générer une requête de recherche basée sur le bien
    const searchQuery = getSearchQuery(
      property.title || "",
      property.description || "",
      (property.details as any)?.type
    );

    console.log(`   Recherche Pexels: "${searchQuery}"`);

    // Récupérer de nouvelles images depuis Pexels
    const newImages = await fetchPexelsImages(searchQuery, images.length);

    if (newImages.length === 0) {
      console.log(`   ⚠️ Aucune image Pexels trouvée, conservation des images existantes`);
      skipped++;
      continue;
    }

    // Remplacer les images Unsplash par les nouvelles images Pexels
    const updatedImages = images.map((img, index) => {
      if (typeof img === "string" && img.includes("unsplash.com")) {
        const pexelsImage = newImages[index % newImages.length];
        if (pexelsImage && typeof pexelsImage === "string" && pexelsImage.length > 0) {
          return pexelsImage;
        }
        // Si pas d'image Pexels disponible, garder l'original (sera remplacé plus tard)
        return img;
      }
      return img;
    }).filter((img) => img && typeof img === "string" && img.length > 0); // Filtrer les images vides

    // Mettre à jour dans Supabase
    const { error: updateError } = await supabase
      .from("properties")
      .update({ images: updatedImages })
      .eq("id", property.id);

    if (updateError) {
      console.error(`   ❌ Erreur lors de la mise à jour:`, updateError);
    } else {
      console.log(`   ✅ ${updatedImages.length} images mises à jour`);
      updated++;
    }

    // Attendre un peu pour éviter de surcharger l'API Pexels
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✨ Terminé! ${updated} propriétés mises à jour, ${skipped} ignorées`);
}

// Exécuter le script
replaceUnsplashImages()
  .then(() => {
    console.log("\n🎉 Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });

