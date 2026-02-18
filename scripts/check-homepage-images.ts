/**
 * Script pour vérifier spécifiquement les images des propriétés affichées sur la home page
 * et les remplacer si elles sont cassées
 * 
 * Usage: npm run check-homepage-images
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PEXELS_API_KEY = "3eFVqLX19mBYTUVCMxhpPH156xmJ8K5ccP5TBwH5R2h90pHMmgb638AS";
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

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

async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok && response.status === 200) {
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.startsWith("image/")) {
        return false;
      }
      return true;
    }
    return false;
  } catch (_error) {
    return false;
  }
}

async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
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
    
    return images;
  } catch (_error) {
    return [];
  }
}

async function checkHomepageImages() {
  console.log("🔍 Vérification des images des propriétés de la home page...\n");

  // Récupérer les propriétés comme sur la home page
  const [locations, ventes, terrains] = await Promise.all([
    // Locations à Dakar
    supabase
      .from("properties")
      .select("id, title, description, images, details, location")
      .eq("category", "location")
      .eq("location->>city", "Dakar")
      .order("created_at", { ascending: false })
      .limit(8),
    
    // Ventes (exclut terrains)
    supabase
      .from("properties")
      .select("id, title, description, images, details, location")
      .eq("category", "vente")
      .order("created_at", { ascending: false })
      .limit(20),
    
    // Terrains
    supabase
      .from("properties")
      .select("id, title, description, images, details, location")
      .eq("category", "vente")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Filtrer comme sur la home page
  const ventesFiltered = (ventes.data || []).filter(
    (p: any) =>
      p.details?.type === "Maison" ||
      p.details?.type === "Appartement" ||
      p.details?.type === "Studio"
  ).slice(0, 8);

  const terrainsFiltered = (terrains.data || []).filter(
    (p: any) =>
      p.details?.type?.toLowerCase().includes("terrain") ||
      p.title?.toLowerCase().includes("terrain") ||
      p.description?.toLowerCase().includes("terrain")
  ).slice(0, 8);

  const allProperties = [
    ...(locations.data || []),
    ...ventesFiltered,
    ...terrainsFiltered,
  ];

  console.log(`📦 ${allProperties.length} propriétés trouvées sur la home page\n`);

  let updated = 0;
  let totalBroken = 0;

  for (const property of allProperties) {
    const images = property.images as string[] | null;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      continue;
    }

    console.log(`🔄 Vérification: ${property.title}`);
    console.log(`   ${images.length} image(s) à vérifier`);

    const brokenIndices: number[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img || typeof img !== "string" || img.length === 0) {
        brokenIndices.push(i);
        continue;
      }
      
      const exists = await checkImageExists(img);
      if (!exists) {
        brokenIndices.push(i);
        console.log(`   ❌ Image ${i + 1} cassée: ${img.substring(0, 60)}...`);
      }
    }

    if (brokenIndices.length === 0) {
      console.log(`   ✅ Toutes les images sont valides\n`);
      continue;
    }

    totalBroken += brokenIndices.length;
    console.log(`   ⚠️ ${brokenIndices.length} image(s) cassée(s) détectée(s)`);

    const searchQuery = getSearchQuery(
      property.title || "",
      property.description || "",
      property.details?.type
    );

    console.log(`   🔍 Recherche Pexels: "${searchQuery}"`);

    const newImages = await fetchPexelsImages(searchQuery, brokenIndices.length);

    if (newImages.length === 0) {
      console.log(`   ⚠️ Aucune image Pexels trouvée\n`);
      continue;
    }

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

    const { error: updateError } = await supabase
      .from("properties")
      .update({ images: updatedImages })
      .eq("id", property.id);

    if (updateError) {
      console.error(`   ❌ Erreur lors de la mise à jour:`, updateError);
    } else {
      console.log(`   ✅ ${brokenIndices.length} image(s) remplacée(s)\n`);
      updated++;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✨ Terminé!`);
  console.log(`   📊 ${updated} propriétés mises à jour`);
  console.log(`   📊 ${totalBroken} image(s) cassée(s) remplacée(s)`);
}

checkHomepageImages()
  .then(() => {
    console.log("\n🎉 Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });


