import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";
import { slugify } from "@/lib/slugs";

export type PropertyFilters = {
  q?: string; // Recherche textuelle
  category?: Property["transaction"];
  city?: string; // Exact match (DB value)
  citySlug?: string; // Slugified match (e.g. "thies-region")
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: Property["status"];
  rooms?: number;
  bedrooms?: number;
  hasBackupGenerator?: boolean;
  hasWaterTank?: boolean;
  isVerified?: boolean; // Filtrer par biens certifiés/vérifiés
  type?: Property["details"]["type"];
  types?: Property["details"]["type"][]; // Support pour sélection multiple
  limit?: number;
};

type SupabasePropertyRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Property["transaction"];
  transaction?: Property["transaction"];
  status?: Property["status"];
  location?: {
    city?: string;
    address?: string;
    landmark?: string;
    coords?: { lat: number; lng: number };
  };
  specs?: {
    surface?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    dpe?: Property["specs"]["dpe"];
  };
  features?: {
    hasGenerator?: boolean;
    hasWaterTank?: boolean;
    security?: boolean;
    [key: string]: unknown;
  };
  details?: {
    type?: Property["details"]["type"];
    year?: number;
    heating?: string;
    charges?: number;
    taxeFonciere?: number;
    parking?: string;
  };
  images?: string[];
  agent?: {
    name?: string;
    photo?: string;
    phone?: string;
    whatsapp?: string;
  };
  service_type?: "mandat_confort" | "boost_visibilite";
  contact_phone?: string;
  view_count?: number;
  verification_status?: Property["verification_status"];
  proof_document_url?: string;
  virtual_tour_url?: string;
  verification_requested_at?: string;
  featured?: boolean;
  exclusive?: boolean;
  created_at: string;

  owner?: {
    id: string;
    full_name: string;
    avatar_url: string;
    role?: "particulier" | "agent" | "admin";
    phone?: string;
    is_identity_verified?: boolean;
    updated_at?: string;
  } | {
    id: string;
    full_name: string;
    avatar_url: string;
    role?: "particulier" | "agent" | "admin";
    phone?: string;
    is_identity_verified?: boolean;
    updated_at?: string;
  }[];
  disponibilite?: string;
  proximites?: {
    transports?: string[];
    ecoles?: string[];
    commerces?: string[];
  };
};

const mapProperty = (row: SupabasePropertyRow): Property => {
  const agent = row.agent || {};
  const features = row.features || {};
  const details = row.details || {};
  const specs = row.specs || {};
  const location = row.location || {};
  const proximites = row.proximites;

  // Gérer le cas où owner est un tableau (join) ou un objet
  const ownerData = Array.isArray(row.owner)
    ? row.owner[0]
    : (row.owner || (row as Record<string, unknown>).profiles);
  const owner = (ownerData ?? {}) as Record<string, unknown>;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    transaction: row.transaction || row.category || "vente",
    status: row.status || "disponible",
    location: {
      city: location.city ?? "",
      address: location.address ?? "",
      landmark: location.landmark ?? "",
      coords: location.coords ?? { lat: 14.6928, lng: -17.4467 },
    },
    specs: {
      surface: specs.surface ?? 0,
      rooms: specs.rooms ?? 0,
      bedrooms: specs.bedrooms ?? 0,
      bathrooms: specs.bathrooms ?? 0,
      dpe: specs.dpe ?? "C",
    },
    details: {
      type: details.type ?? "Appartement",
      year: details.year ?? 0,
      heating: details.heating ?? "",
      charges: details.charges,
      taxeFonciere: details.taxeFonciere,
      parking: details.parking,
      hasBackupGenerator: features.hasGenerator ?? false,
      hasWaterTank: features.hasWaterTank ?? false,
      security: features.security ?? false,
    },
    images: row.images ?? [],
    agent: {
      name: agent.name ?? "",
      photo: agent.photo ?? "",
      phone: agent.phone ?? "",
      whatsapp: agent.whatsapp,
    },
    owner: owner && (owner.phone || owner.full_name || owner.id)
      ? {
        id: owner.id as string,
        full_name: owner.full_name as string,
        avatar_url: owner.avatar_url as string,
        role: (owner.role as "particulier" | "agent" | "admin") || "particulier",
        phone: owner.phone as string,
        is_identity_verified: (owner.is_identity_verified as boolean) || false,
        updated_at: owner.updated_at as string,
      }
      : undefined,
    disponibilite: row.disponibilite ?? "Immédiate",
    proximites: proximites && (
      proximites.transports?.length ||
      proximites.ecoles?.length ||
      proximites.commerces?.length
    ) ? proximites as Property["proximites"] : undefined,
    contact_phone: row.contact_phone,
    view_count: row.view_count,
    verification_status: row.verification_status,
    proof_document_url: row.proof_document_url,
    virtual_tour_url: row.virtual_tour_url,
    verification_requested_at: row.verification_requested_at,
    featured: row.featured,
    exclusive: row.exclusive,
  };
};

export const getProperties = async (filters: PropertyFilters = {}) => {
  try {
    // Optimisation : ne sélectionner que les colonnes nécessaires pour la liste
    // Cela réduit significativement le transfert de données
    let query = supabase
      .from("properties")
      .select(
        "id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status, verification_status, view_count"
      );

    // Filtrer uniquement les propriétés approuvées et disponibles
    // Ces filtres garantissent que seules les annonces valides sont affichées
    query = query.eq("validation_status", "approved");
    query = query.eq("status", "disponible");

    // Recherche textuelle (q) : recherche dans le titre, la description et la ville
    if (filters.q) {
      // Nettoyage de la recherche
      let searchTerm = filters.q.trim();

      // Si la recherche contient une virgule (ex: "Mermoz, Dakar"), on prend le premier terme
      // car c'est généralement le plus spécifique (quartier/ville)
      if (searchTerm.includes(",")) {
        const parts = searchTerm.split(",");
        if (parts.length > 0) {
          searchTerm = parts[0].trim();
        }
      }

      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location->>city.ilike.%${searchTerm}%,location->>address.ilike.%${searchTerm}%`
      );
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.city) {
      query = query.eq("location->>city", filters.city);
    }
    // Gestion du citySlug : on résout le slug en vrai nom de ville
    if (filters.citySlug) {
      const resolvedCity = await getCityNameFromSlug(filters.citySlug);
      if (resolvedCity) {
        // Use wildcards for maximum safety against whitespace/hidden chars
        query = query.ilike("location->>city", `%${resolvedCity}%`);
      } else {
        // Fallback approx
        const fallback = filters.citySlug.replace(/-/g, ' ');
        query = query.ilike("location->>city", `%${fallback}%`);
      }
    }
    if (filters.minPrice) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte("price", filters.maxPrice);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.location) {
      query = query.ilike("location->>city", `%${filters.location}%`);
    } else if (filters.city) {
      query = query.eq("location->>city", filters.city);
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
    // Support pour un seul type ou plusieurs types (OR)
    // Support pour types multiples
    // On cherche uniquement dans details->>type avec des jokers pour la souplesse
    if (filters.types && filters.types.length > 0) {
      const orConditions = filters.types
        .flatMap((type) => [
          `details->>type.ilike.%${type}%`
        ])
        .join(",");
      query = query.or(orConditions);
    } else if (filters.type) {
      // Chercher dans details.type (case-insensitive)
      query = query.or(
        `details->>type.ilike.%${filters.type}%`
      );
    }

    query = query.order("created_at", {
      ascending: false,
    });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("getProperties Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    return (data ?? []).map(mapProperty);
  } catch (error) {
    console.error("getProperties error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
};

export const getPropertiesCount = async (filters: PropertyFilters = {}) => {
  try {
    let query = supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    // Même logique de filtrage que getProperties
    query = query.eq("validation_status", "approved");
    query = query.eq("status", "disponible");

    if (filters.q) {
      query = query.or(
        `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,location->>city.ilike.%${filters.q}%`
      );
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.city) {
      query = query.eq("location->>city", filters.city);
    }
    if (filters.citySlug) {
      const resolvedCity = await getCityNameFromSlug(filters.citySlug);
      if (resolvedCity) {
        query = query.ilike("location->>city", `%${resolvedCity}%`);
      } else {
        const fallback = filters.citySlug.replace(/-/g, ' ');
        query = query.ilike("location->>city", `%${fallback}%`);
      }
    }
    if (filters.minPrice) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte("price", filters.maxPrice);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.location) {
      query = query.ilike("location->>city", `%${filters.location}%`);
    } else if (filters.city) {
      query = query.eq("location->>city", filters.city);
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
    if (filters.types && filters.types.length > 0) {
      const orConditions = filters.types
        .flatMap((type) => [
          `details->>type.ilike.%${type}%`
        ])
        .join(",");
      query = query.or(orConditions);
    } else if (filters.type) {
      query = query.or(
        `details->>type.ilike.%${filters.type}%`
      );
    }

    const { count, error } = await query;
    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error("getPropertiesCount error details:", {
      message: error instanceof Error ? error.message : String(error),
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code
    });
    return 0;
  }
};

export const getPropertyById = async (id: string) => {
  try {
    // Pour l'instant, utiliser directement le fallback (requête séparée)
    // car la jointure peut ne pas fonctionner si la table profiles n'existe pas encore
    // ou si la relation n'est pas configurée dans Supabase
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Si c'est une erreur 404 (not found), c'est normal
      if (error.code === "PGRST116") {
        console.warn("getPropertyById: Property not found for id:", id);
        return null;
      }
      throw error;
    }

    if (!data) {
      console.warn("getPropertyById: No data returned for id:", id);
      return null;
    }

    // Si on a des données et un owner_id, récupérer le profil séparément
    if (data.owner_id) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, phone, is_identity_verified, updated_at")
          .eq("id", data.owner_id)
          .single();

        if (!profileError && profileData) {
          data.owner = profileData;
        } else if (profileError) {
          // Si la table profiles n'existe pas encore ou le profil n'existe pas, c'est normal
          // On ne log que les erreurs inattendues (pas les 404 ou "does not exist")
          if (profileError.code !== "PGRST116" && !profileError.message?.includes("does not exist")) {
            // Seulement logger les vraies erreurs (permissions, etc.)
            console.warn("getPropertyById: Erreur lors de la récupération du profil", {
              code: profileError.code,
              message: profileError.message,
              owner_id: data.owner_id,
            });
          }
          // Sinon, on ignore silencieusement (profil non trouvé ou table inexistante)
        }
      } catch (profileError) {
        console.warn("getPropertyById: Exception lors de la récupération du profil", profileError);
      }
    }

    try {
      const mappedProperty = mapProperty(data as SupabasePropertyRow);

      return mappedProperty;
    } catch (mappingError) {
      console.error("getPropertyById mapping error:", {
        error: mappingError,
        data,
        id,
        errorMessage: mappingError instanceof Error ? mappingError.message : String(mappingError),
        errorStack: mappingError instanceof Error ? mappingError.stack : undefined,
      });
      return null;
    }
  } catch (error) {
    console.error("getPropertyById error:", {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      id,
    });
    return null;
  }
};

export const getLatestProperties = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status, view_count")
      .eq("validation_status", "approved")
      .eq("status", "disponible")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapProperty);
  } catch (error) {
    console.error("getLatestProperties error", error);
    return [];
  }
};

/**
 * Récupère les IDs des biens approuvés pour la génération statique
 * Utilisé dans generateStaticParams pour pré-générer les pages
 */
export const getApprovedPropertyIds = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id")
      .eq("validation_status", "approved")
      .neq("status", "loué")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => row.id);
  } catch (error) {
    console.error("getApprovedPropertyIds error", error);
    return [];
  }
};

export const getSimilarProperties = async (
  category: Property["transaction"],
  city: string,
  limit = 4,
  excludeId?: string
) => {
  try {
    let query = supabase
      .from("properties")
      .select("id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status, view_count")
      .eq("validation_status", "approved")
      .eq("status", "disponible")
      .eq("location->>city", city)
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []).map(mapProperty);
  } catch (error) {
    console.error("getSimilarProperties error:", error); // Improved logging
    return [];
  }
};

export const deleteProperty = async (id: string) => {
  try {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("deleteProperty error", error);
    return false;
  }
};

/**
 * Incrémente le compteur de vues d'une propriété de manière atomique
 * Utilise la fonction RPC increment_view_count pour garantir la cohérence
 * 
 * @param id - ID de la propriété
 * @returns Le nouveau total de vues, ou null en cas d'erreur
 */
export const incrementView = async (id: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase.rpc("increment_view_count", {
      property_id_param: id,
    });

    if (error) {
      console.error("incrementView error:", error);
      return null;
    }

    return data as number;
  } catch (error) {
    console.error("incrementView unexpected error:", error);
    return null;
  }
};

/**
 * Récupère des suggestions de lieux pour l'autocomplétion
 * @param query - Début du nom de ville ou quartier
 */
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];

  const searchTerm = query.trim();
  const suggestions = new Set<string>();

  try {
    // 1. Chercher dans les propriétés internes (location->>city)
    const { data: internalData } = await supabase
      .from("properties")
      .select("location")
      .ilike("location->>city", `%${searchTerm}%`)
      .limit(10);

    if (internalData) {
      internalData.forEach((row: any) => {
        if (row.location?.city) {
          suggestions.add(row.location.city);
          // Si le quartier est dispo et matche aussi
          if (row.location.district && row.location.district.toLowerCase().includes(searchTerm.toLowerCase())) {
            suggestions.add(`${row.location.district}, ${row.location.city}`);
          }
        }
      });
    }

    // 2. Chercher dans les annonces externes (city)
    const { data: externalData } = await supabase
      .from("external_listings")
      .select("city, location")
      .or(`city.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .limit(10);

    if (externalData) {
      externalData.forEach((row: any) => {
        if (row.city) suggestions.add(row.city);
        // Pour les externes, 'location' est souvent le quartier ou l'adresse complète
        if (row.location) {
          // On essaie de nettoyer un peu si c'est très long
          const cleanLoc = row.location.split(',')[0].trim();
          if (cleanLoc.length < 40) {
            suggestions.add(row.location);
          }
        }
      });
    }

    // Convertir en tableau, trier et limiter
    return Array.from(suggestions)
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Mettre les matches exacts ou qui commencent par le terme en premier
        const aStarts = a.toLowerCase().startsWith(searchTerm.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(searchTerm.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);

  } catch (error) {
    console.error("getSearchSuggestions error:", error);
    return [];
  }
};

/**
 * Résout un slug de ville (ex: "thies-region") en son vrai nom (ex: "Thiès Region")
 * Utilise le cache des villes actives via RPC
 */
export const getCityNameFromSlug = async (slug: string): Promise<string | null> => {
  try {
    // On récupère toutes les villes actives
    // TODO: Mettre en cache cette réponse si possible pour éviter trop d'appels
    const { data, error } = await supabase
      .rpc('get_active_cities_and_types');

    if (error || !data) return null;

    // On cherche la première ville dont le slug correspond
    const match = (data as { city: string }[]).find(item => slugify(item.city) === slug);

    return match ? match.city : null;
  } catch (err) {
    console.error("getCityNameFromSlug error:", err);
    return null;
  }
};


/**
 * Récupère la liste des villes actives (ayant au moins une annonce approuvée)
 * Utilisé pour le maillage interne (Villes à proximité)
 */
export const getActiveCities = async (): Promise<string[]> => {
  try {
    // Utilise la RPC existante qui retourne { city, type }
    const { data, error } = await supabase.rpc('get_active_cities_and_types');

    if (error || !data) return [];

    // Extraction et déduplication des villes
    const citiesSet = new Set<string>();
    (data as { city: string }[]).forEach(item => {
      if (item.city) citiesSet.add(item.city);
    });

    return Array.from(citiesSet).sort();
  } catch (error) {
    console.error("getActiveCities error:", error);
    return [];
  }
};
