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

// ... imports
import {
  getOrSetCacheSWR,
  getOrSetCacheWithMetrics,
} from "@/lib/cache/advanced-patterns";
import { getProperties, type PropertyFilters } from "./propertyService";
import type { Property } from "@/types/property";

/**
 * Récupère les locations populaires à Dakar (VERSION CACHÉE + MÉTRIQUES)
 * TTL : 5 minutes (données changent rarement)
 */
export async function getPopularLocations(limit = 8): Promise<Property[]> {
  return getOrSetCacheWithMetrics(
    `popular_locations_${limit}`,
    async () => {
      try {
        return await getProperties({
          category: "location",
          city: "Dakar",
          limit,
        } as PropertyFilters);
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching popular locations:",
          error
        );
        return [];
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
 * Récupère les propriétés à vendre (VERSION CACHÉE + MÉTRIQUES)
 * Exclut automatiquement les terrains
 * TTL : 5 minutes
 */
export async function getPropertiesForSale(limit = 8): Promise<Property[]> {
  return getOrSetCacheWithMetrics(
    `properties_for_sale_${limit}`,
    async () => {
      try {
        // Récupérer plus de propriétés pour avoir assez après filtrage
        const allProperties = await getProperties({
          category: "vente",
          limit: limit * 3,
        } as PropertyFilters);

        // Filtrer pour exclure les terrains
        return allProperties
          .filter(
            (p) =>
              p.details.type === "Maison" ||
              p.details.type === "Appartement" ||
              p.details.type === "Studio"
          )
          .slice(0, limit);
      } catch (error) {
        console.error(
          "[homeService.cached] Error fetching properties for sale:",
          error
        );
        return [];
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
export async function getLandForSale(limit = 8): Promise<Property[]> {
  return getOrSetCacheWithMetrics(
    `land_for_sale_${limit}`,
    async () => {
      try {
        // Récupérer plus de propriétés pour avoir assez après filtrage
        const allProperties = await getProperties({
          category: "vente",
          limit: limit * 3,
        } as PropertyFilters);

        // Filtrer pour ne garder que les terrains
        return allProperties
          .filter(
            (p) =>
              p.details.type?.toLowerCase().includes("terrain") ||
              p.title.toLowerCase().includes("terrain") ||
              p.description.toLowerCase().includes("terrain")
          )
          .slice(0, limit);
      } catch (error) {
        console.error("[homeService.cached] Error fetching land for sale:", error);
        return [];
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
    "all_sections",
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
          locations: [],
          ventes: [],
          terrains: [],
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
