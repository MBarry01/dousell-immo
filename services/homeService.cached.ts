/**
 * Service home page AVEC cache Redis/Valkey
 *
 * Version cachée pour performance optimale :
 * - 1er utilisateur : 300ms (DB)
 * - Utilisateurs suivants : 5ms (Redis)
 * - Gain : 98% réduction latence
 *
 * @see REDIS_CACHE_STRATEGY.md
 */

import {
  getOrSetCacheSWR,
  getOrSetCacheWithMetrics,
} from "@/lib/cache/advanced-patterns";
import { getProperties, getPropertiesCount, type PropertyFilters } from "./propertyService";
import { getExternalListingsByType } from "./gatewayService";
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
 * TTL : 5 minutes (données changent rarement)
 */
export async function getPopularLocations(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `popular_locations_v3_${limit}`, // v3: with partner listings
    async () => {
      try {
        const filters = {
          category: "location",
          city: "Dakar",
          limit,
        } as PropertyFilters;

        // Requêtes parallèles: internes + externes
        const [internalProperties, total, externalProperties] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("location", { city: "Dakar", limit }),
        ]);

        // Fusion avec priorité aux internes
        const properties = mergeWithExternals(internalProperties, externalProperties, limit);

        return { properties, total };
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching popular locations:",
          error
        );
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 300, // 5 minutes
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

export async function getPropertiesForSale(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `properties_for_sale_v3_${limit}`, // v3: with partner listings
    async () => {
      try {
        const filters = {
          category: "vente",
          types: ["Maison", "Appartement", "Studio"],
          limit: limit,
        } as PropertyFilters;

        // Requêtes parallèles: internes + externes (Appartement/Villa/Maison)
        const [internalProperties, total, externalProperties] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("vente", { limit }),
        ]);

        // Fusion avec priorité aux internes
        const properties = mergeWithExternals(internalProperties, externalProperties, limit);

        return { properties, total };
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching properties for sale:",
          error
        );
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 300, // 5 minutes
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

/**
 * Récupère les terrains à vendre (VERSION CACHÉE + MÉTRIQUES)
 * TTL : 5 minutes
 */
export async function getLandForSale(limit = 8): Promise<SectionResult> {
  return getOrSetCacheWithMetrics(
    `land_for_sale_v3_${limit}`, // v3: with partner listings
    async () => {
      try {
        const filters = {
          category: "vente",
          type: "Terrain",
          limit: limit,
        } as PropertyFilters;

        // Requêtes parallèles: internes + externes (Terrains)
        const [internalProperties, total, externalProperties] = await Promise.all([
          getProperties(filters),
          getPropertiesCount(filters),
          getExternalListingsByType("vente", { category: "Terrain", limit }),
        ]);

        // Fusion avec priorité aux internes
        const properties = mergeWithExternals(internalProperties, externalProperties, limit);

        return { properties, total };
      } catch (error) {
        console.error("[homeService.cached] Error fetching land for sale:", error);
        return { properties: [], total: 0 };
      }
    },
    {
      ttl: 300, // 5 minutes
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}

/**
 * Récupère toutes les sections de la home page en parallèle (VERSION CACHÉE SWR)
 *
 * Utilise le pattern Stale-While-Revalidate :
 * 1. Retourne le cache stale IMMÉDIATEMENT (<5ms)
 * 2. Rafraîchit en background si nécessaire
 *
 * Performance attendue :
 * - Latence perçue : ~5ms (constante)
 * - Freshness : Max 50% du TTL de retard (2.5 mins)
 */
export async function getHomePageSections() {
  return getOrSetCacheSWR(
    "all_sections_v3", // v3: with partner listings fill strategy
    async () => {
      try {
        // Les 3 sections utilisent getOrSetCacheWithMetrics individuellement
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
      ttl: 300, // 5 minutes
      namespace: "homepage",
      debug: process.env.NODE_ENV === "development",
    }
  );
}
