/**
 * Service spécialisé pour la page d'accueil
 * Optimisé pour récupérer les sections de biens de manière efficace
 */

import { getProperties, type PropertyFilters } from "./propertyService";
import type { Property } from "@/types/property";

/**
 * Récupère les locations populaires à Dakar
 * @param limit Nombre de propriétés à récupérer (défaut: 8)
 */
export async function getPopularLocations(limit = 8): Promise<Property[]> {
  try {
    return await getProperties({
      category: "location",
      city: "Dakar",
      limit,
    } as PropertyFilters);
  } catch (error) {
    console.error("[homeService] Error fetching popular locations:", error);
    return [];
  }
}

/**
 * Récupère les propriétés à vendre (Villas, Appartements, Studios)
 * Exclut automatiquement les terrains
 * @param limit Nombre de propriétés à récupérer (défaut: 8)
 */
export async function getPropertiesForSale(limit = 8): Promise<Property[]> {
  try {
    // Récupérer plus de propriétés pour avoir assez après filtrage
    const allProperties = await getProperties({
      category: "vente",
      limit: limit * 3, // Récupérer 3x plus pour compenser le filtrage
    } as PropertyFilters);

    // Filtrer intelligemment pour exclure les terrains
    const keywords = ["maison", "villa", "studio", "appartement", "duplex", "immeuble", "chambre", "suite"];
    return allProperties
      .filter((p) => {
        const type = (p.details.type || "").toLowerCase();
        const title = (p.title || "").toLowerCase();

        // Exclure si c'est explicitement un terrain
        if (type.includes("terrain") || title.includes("terrain") || title.includes("parcelle")) {
          return false;
        }

        // Inclure si le type ou le titre match un mot-clé de "logement"
        return keywords.some(k => type.includes(k) || title.includes(k));
      })
      .slice(0, limit);
  } catch (error) {
    console.error("[homeService] Error fetching properties for sale:", error);
    return [];
  }
}

/**
 * Récupère les terrains à vendre
 * @param limit Nombre de terrains à récupérer (défaut: 8)
 */
export async function getLandForSale(limit = 8): Promise<Property[]> {
  try {
    // Récupérer plus de propriétés pour avoir assez après filtrage
    const allProperties = await getProperties({
      category: "vente",
      limit: limit * 3, // Récupérer 3x plus pour compenser le filtrage
    } as PropertyFilters);

    // Filtrer pour ne garder que les terrains
    const landKeywords = ["terrain", "parcelle", "lotissement", "zone industrielle"];
    return allProperties
      .filter((p) => {
        const type = (p.details.type || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();

        return landKeywords.some(k =>
          type.includes(k) ||
          title.includes(k) ||
          desc.includes(k)
        );
      })
      .slice(0, limit);
  } catch (error) {
    console.error("[homeService] Error fetching land for sale:", error);
    return [];
  }
}

/**
 * Récupère toutes les sections de la home page en parallèle
 * Optimisé pour réduire le temps de chargement
 */
export async function getHomePageSections() {
  try {
    const [locations, ventes, terrains] = await Promise.all([
      getPopularLocations(8),
      getPropertiesForSale(8),
      getLandForSale(8),
    ]);

    return {
      locations,
      ventes,
      terrains,
    };
  } catch (error) {
    console.error("[homeService] Error fetching home page sections:", error);
    return {
      locations: [],
      ventes: [],
      terrains: [],
    };
  }
}


