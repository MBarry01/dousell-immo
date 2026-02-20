import { getOrSetCache } from "@/lib/cache/cache-aside";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { mapProperty } from "@/services/propertyService";
import type { Property } from "@/types/property";
import type { PropertyFilters } from "./propertyService";
export type { PropertyFilters };

/**
 * 📄 Récupérer un bien par ID (avec cache)
 *
 * TTL : 1 heure (les biens changent rarement)
 * Cache key : `detail:{id}`
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  return getOrSetCache(
    `detail:${id}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      if (!data) return null;

      // Utiliser l'admin client pour bypasser les RLS sur les tables profiles et teams
      const adminClient = createAdminClient();

      // Récupérer le profil du propriétaire
      if (data.owner_id) {
        try {
          const { data: profileData } = await adminClient
            .from("profiles")
            .select("id, full_name, avatar_url, role, phone, is_identity_verified, updated_at")
            .eq("id", data.owner_id)
            .single();

          if (profileData) {
            // Si pas de téléphone dans le profil, utiliser contact_phone
            if (!profileData.phone && data.contact_phone) {
              profileData.phone = data.contact_phone;
            }
            console.log("[getPropertyById cached] owner:", {
              full_name: profileData.full_name,
              phone: profileData.phone,
              role: profileData.role,
            });
            data.owner = profileData;
          }
        } catch { /* profil non trouvé, continuer */ }
      }

      // Récupérer les données de l'équipe
      if (data.team_id) {
        try {
          const { data: teamData } = await adminClient
            .from("teams")
            .select("id, name, logo_url, company_phone, company_email")
            .eq("id", data.team_id)
            .single();

          if (teamData) {
            console.log("[getPropertyById cached] team:", { name: teamData.name });
            data.team = teamData;
          }
        } catch { /* équipe non trouvée, continuer */ }
      }

      // Mapper via la fonction standard
      return mapProperty(data);
    },
    {
      ttl: 3600, // 1 heure
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 🏙️ Récupérer les biens par ville (avec cache)
 *
 * TTL : 10 minutes (résultats de recherche changent modérément)
 * Cache key : `city:{city}`
 */
export async function getPropertiesByCity(
  city: string,
  limit = 20
): Promise<Property[]> {
  return getOrSetCache(
    `city:${city}:limit:${limit}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("location->>city", city)
        .eq("status", "disponible")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Property[];
    },
    {
      ttl: 600, // 10 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 🔍 Recherche avec filtres (avec cache intelligent)
 *
 * TTL : 5 minutes (recherches fréquentes mais résultats changeants)
 * Cache key : basé sur hash des filtres
 */
export async function getPropertiesWithFilters(
  filters: PropertyFilters
): Promise<Property[]> {
  // Créer une clé de cache basée sur les filtres
  const cacheKey = `search:${JSON.stringify(filters)}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const supabase = await createClient();

      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", filters.status || "disponible");

      // Recherche textuelle
      if (filters.q) {
        query = query.or(
          `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,location->>city.ilike.%${filters.q}%`
        );
      }

      // Filtres spécifiques
      if (filters.category) {
        query = query.eq("category", filters.category);
      }
      if (filters.city) {
        query = query.eq("location->>city", filters.city);
      }
      if (filters.minPrice) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters.location) {
        query = query.ilike("location->>city", `%${filters.location}%`);
      }
      if (filters.rooms) {
        query = query.gte("specs->>rooms", String(filters.rooms));
      }
      if (filters.bedrooms) {
        query = query.gte("specs->>bedrooms", String(filters.bedrooms));
      }
      if (filters.hasBackupGenerator) {
        query = query.eq("features->>hasGenerator", "true");
      }
      if (filters.hasWaterTank) {
        query = query.eq("features->>hasWaterTank", "true");
      }
      if (filters.isVerified) {
        query = query.eq("verification_status", "verified");
      }

      // Support pour types multiples
      // On cherche dans details->>type ET property_type car certains biens (terrains) n'ont que property_type
      // Support pour types multiples
      // On cherche dans details->>type ET property_type car certains biens (terrains) n'ont que property_type
      if (filters.types && filters.types.length > 0) {
        const orConditions = filters.types
          .flatMap((type) => [
            `details->>type.ilike.${type}`,
            `property_type.ilike.${type}`
          ])
          .join(",");
        query = query.or(orConditions);
      } else if (filters.type) {
        // Chercher dans details.type OU property_type (case-insensitive)
        query = query.or(`details->>type.ilike.${filters.type},property_type.ilike.${filters.type}`);
      }

      query = query.order("created_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Property[];
    },
    {
      ttl: 300, // 5 minutes
      namespace: "properties_v2", // Force refresh
      debug: true,
    }
  );
}

/**
 * 🏠 Récupérer les biens d'un propriétaire (avec cache)
 *
 * TTL : 5 minutes (propriétaires consultent souvent)
 * Cache key : `owner:{ownerId}`
 */
export async function getPropertiesByOwner(
  ownerId: string
): Promise<Property[]> {
  return getOrSetCache(
    `owner:${ownerId}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Property[];
    },
    {
      ttl: 300, // 5 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * ⭐ Récupérer les biens en vedette (avec cache)
 *
 * Critères : biens approuvés, disponibles, avec service premium (boost_visibilite)
 * Fallback : les biens les plus récents si pas assez de biens premium
 *
 * TTL : 30 minutes (change rarement, beaucoup de lectures)
 * Cache key : `featured`
 */
export async function getFeaturedProperties(
  limit = 8
): Promise<Property[]> {
  return getOrSetCache(
    `featured:limit:${limit}`,
    async () => {
      const supabase = await createClient();

      // Priorité aux biens avec service premium (boost_visibilite)
      const { data: premiumData, error: premiumError } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "disponible")
        .eq("validation_status", "approved")
        .eq("service_type", "boost_visibilite")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (premiumError) throw premiumError;

      // Si assez de biens premium, retourner directement
      if (premiumData && premiumData.length >= limit) {
        return premiumData as Property[];
      }

      // Sinon, compléter avec les biens récents approuvés
      const remaining = limit - (premiumData?.length || 0);
      const premiumIds = premiumData?.map(p => p.id) || [];

      const { data: recentData, error: recentError } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "disponible")
        .eq("validation_status", "approved")
        .not("id", "in", `(${premiumIds.length > 0 ? premiumIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
        .order("created_at", { ascending: false })
        .limit(remaining);

      if (recentError) throw recentError;

      return [...(premiumData || []), ...(recentData || [])] as Property[];
    },
    {
      ttl: 1800, // 30 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 📊 Statistiques propriétaire (avec cache)
 *
 * TTL : 10 minutes
 * Cache key : `owner_stats:{ownerId}`
 */
export async function getOwnerPropertyStats(ownerId: string) {
  return getOrSetCache(
    `owner_stats:${ownerId}`,
    async () => {
      const supabase = await createClient();

      const [totalResult, activeResult, pendingResult] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", ownerId),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", ownerId)
          .eq("status", "disponible"),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", ownerId)
          .eq("status", "pending"),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        pending: pendingResult.count || 0,
      };
    },
    {
      ttl: 600, // 10 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 🔗 Récupérer les IDs de biens approuvés (pour static params)
 *
 * TTL : 30 minutes
 * Cache key : `approved_ids:{limit}`
 */
export async function getApprovedPropertyIds(limit = 20): Promise<string[]> {
  return getOrSetCache(
    `approved_ids:${limit}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("id")
        .eq("validation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => row.id);
    },
    {
      ttl: 1800, // 30 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 🎯 Récupérer les biens similaires (avec cache)
 *
 * TTL : 15 minutes
 * Cache key : `similar:{category}:{city}:{excludeId}`
 */
export async function getSimilarProperties(
  category: string,
  city: string,
  limit = 4,
  excludeId?: string
): Promise<Property[]> {
  const cacheKey = `similar:${category}:${city}:${excludeId || "none"}:${limit}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const supabase = await createClient();

      let query = supabase
        .from("properties")
        .select("*")
        .eq("category", category)
        .eq("location->>city", city)
        .eq("status", "disponible")
        .eq("validation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Property[];
    },
    {
      ttl: 900, // 15 minutes
      namespace: "properties",
      debug: true,
    }
  );
}

/**
 * 📰 Récupérer les biens les plus récents (avec cache)
 *
 * TTL : 10 minutes
 * Cache key : `latest:{limit}`
 */
export async function getLatestProperties(limit = 6): Promise<Property[]> {
  return getOrSetCache(
    `latest:${limit}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("validation_status", "approved")
        .eq("status", "disponible")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Property[];
    },
    {
      ttl: 600, // 10 minutes
      namespace: "properties",
      debug: true,
    }
  );
}
