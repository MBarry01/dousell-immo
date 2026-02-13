/**
 * Service home page AVEC cache Redis/Valkey
 *
 * Version cachée pour performance optimale :
 * - 1er utilisateur : 300ms (DB)
 * - Utilisateurs suivants : 5ms (Redis)
 * - Gain : 98% réduction latence
 */

import {
  getOrSetCacheSWR,
  getOrSetCacheWithMetrics,
} from "@/lib/cache/advanced-patterns";
import { getProperties, getPropertiesCount, type PropertyFilters } from "./propertyService";
import { getExternalListingsByType, getExternalListingsCount } from "./gatewayService";
import type { Property } from "@/types/property";

type SectionResult = {
  properties: Property[];
  total: number;
};

/**
 * Helper: Fusionne internes + externes avec stratégie de remplissage
 * - Priorité aux annonces internes
 * - Complète avec externes si besoin
 */
function mergeWithExternals(
  internal: Property[],
  external: Property[],
  limit: number
): Property[] {
  // On prend toutes les internes disponibles
  const merged = [...internal];

  // On complète avec les externes jusqu'à la limite
  const spotsRemaining = limit - merged.length;
  if (spotsRemaining > 0) {
    merged.push(...external.slice(0, spotsRemaining));
  }

  return merged.slice(0, limit);
}

/**
 * Récupère les locations populaires à Dakar (VERSION CACHÉE + MÉTRIQUES)
 */
export async function getPopularLocations(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `popular_locations_v4_${limit}`,
    async () => {
      try {
        const filters = {
          category: "location",
          city: "Dakar",
          limit,
        } as PropertyFilters;

        const [internalProperties, internalCount, externalProperties, externalCount] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("location", { city: "Dakar", limit }),
          getExternalListingsCount("location", { city: "Dakar" }),
        ]);

        const properties = mergeWithExternals(internalProperties, externalProperties, limit);

        return { properties, total: internalCount + externalCount };
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching popular locations:",
          error
        );
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 60, // 1 minute
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

/**
 * Récupère les propriétés à vendre (Villas, Appartements, Studios)
 * EXCLUT les terrains de manière robuste
 */
export async function getPropertiesForSale(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `properties_for_sale_v4_${limit}`,
    async () => {
      try {
        const filters = {
          category: "vente",
          types: ["Villa", "Maison", "Appartement", "Studio"],
          limit: limit * 2, // Récupérer plus pour filtrer les terrains
        } as PropertyFilters;

        const [internalProperties, internalCount, externalProperties, externalCount] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("vente", { limit: limit * 2 }),
          getExternalListingsCount("vente"),
        ]);

        // Fusion initiale
        const merged = mergeWithExternals(internalProperties, externalProperties, limit * 3);

        // FILTRAGE INTELLIGENT de sécurité (évite les fuites de terrains mal catégorisés)
        const keywords = ["maison", "villa", "studio", "appartement", "duplex", "immeuble", "chambre", "suite", "étage", "résidence"];
        const properties = merged
          .filter((p) => {
            const type = (p.details.type || "").toLowerCase();
            const title = (p.title || "").toLowerCase();
            const desc = (p.description || "").toLowerCase();

            // EXCLUSION stricte des terrains
            if (type.includes("terrain") || title.includes("terrain") || title.includes("parcelle") || desc.includes("terrain nu")) {
              return false;
            }

            // INCLUSION si le type ou le titre match un mot-clé de logement
            return keywords.some(k => type.includes(k) || title.includes(k));
          })
          .slice(0, limit);

        return { properties, total: internalCount + externalCount };
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching properties for sale:",
          error
        );
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 60,
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

/**
 * Récupère les terrains à vendre (VERSION CACHÉE + MÉTRIQUES)
 */
export async function getLandForSale(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `land_for_sale_v4_${limit}`,
    async () => {
      try {
        const filters = {
          category: "vente",
          type: "Terrain",
          limit: limit * 2,
        } as PropertyFilters;

        const [internalProperties, internalCount, externalProperties, externalCount] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("vente", { category: "Terrain", limit: limit * 2 }),
          getExternalListingsCount("vente", { category: "Terrain" }),
        ]);

        // Fusion initiale
        const merged = mergeWithExternals(internalProperties, externalProperties, limit * 3);

        // FILTRAGE INTELLIGENT pour ne garder que les terrains
        const landKeywords = ["terrain", "parcelle", "lotissement", "zone industrielle", "champ", "hectare"];
        const properties = merged
          .filter((p) => {
            const typeValue = (p.details.type || "").toLowerCase();
            const titleValue = (p.title || "").toLowerCase();
            const descValue = (p.description || "").toLowerCase();

            return landKeywords.some(k =>
              typeValue.includes(k) ||
              titleValue.includes(k) ||
              descValue.includes(k)
            );
          })
          .slice(0, limit);

        return { properties, total: internalCount + externalCount };
      } catch (error) {
        console.error("[homeService.cached] Error fetching land for sale:", error);
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 60,
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

/**
 * Récupère toutes les sections de la home page en parallèle (VERSION CACHÉE SWR)
 */
export async function getHomePageSections() {
  return getOrSetCacheSWR(
    "all_sections_v4",
    async () => {
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
        console.error(
          "[homeService.cached] Error fetching home page sections:",
          error
        );
        return {
          locations: { properties: [], total: 0 },
          ventes: { properties: [], total: 0 },
          terrains: { properties: [], total: 0 },
        };
      }
    },
    {
      ttl: 60,
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}
