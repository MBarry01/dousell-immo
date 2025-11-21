import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";

export type PropertyFilters = {
  category?: Property["transaction"];
  city?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: Property["status"];
  rooms?: number;
  bedrooms?: number;
  hasBackupGenerator?: boolean;
  hasWaterTank?: boolean;
  type?: Property["details"]["type"];
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
  owner?: {
    phone?: string;
    name?: string;
  };
  proximites?: {
    transports?: string[];
    ecoles?: string[];
    commerces?: string[];
  };
  disponibilite?: string;
  created_at?: string;
};

const mapProperty = (row: SupabasePropertyRow): Property => {
  const location = row.location ?? {};
  const specs = row.specs ?? {};
  const features = row.features ?? {};
  const agent = row.agent ?? {};
  const owner = row.owner ?? {};
  const detail = row.details ?? {};
  const proximites = row.proximites;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    transaction: row.category ?? row.transaction ?? "vente",
    status: row.status ?? "disponible",
    location: {
      city: location.city ?? "",
      address: location.address ?? "",
      landmark: location.landmark ?? "",
      coords: location.coords ?? { lat: 0, lng: 0 },
    },
    specs: {
      surface: specs.surface ?? 0,
      rooms: specs.rooms ?? 0,
      bedrooms: specs.bedrooms ?? 0,
      bathrooms: specs.bathrooms ?? 0,
      dpe: specs.dpe ?? "B",
    },
    details: {
      type: detail.type ?? "Appartement",
      year: detail.year ?? 0,
      heating: detail.heating ?? "",
      charges: detail.charges,
      taxeFonciere: detail.taxeFonciere,
      parking: detail.parking,
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
    owner: owner.phone || owner.name
      ? {
          phone: owner.phone,
          name: owner.name,
        }
      : undefined,
    disponibilite: row.disponibilite ?? "Immédiate",
    proximites: proximites && (
      proximites.transports?.length ||
      proximites.ecoles?.length ||
      proximites.commerces?.length
    ) ? proximites as Property["proximites"] : undefined,
  };
};

export const getProperties = async (filters: PropertyFilters = {}) => {
  try {
    // Optimisation : ne sélectionner que les colonnes nécessaires pour la liste
    // Cela réduit significativement le transfert de données
    let query = supabase
      .from("properties")
      .select(
        "id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status"
      );

    // Filtrer uniquement les propriétés approuvées et disponibles
    // Ces filtres garantissent que seules les annonces valides sont affichées
    query = query.eq("validation_status", "approved");
    query = query.eq("status", "disponible");

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
    if (filters.type) {
      query = query.eq("details->>type", filters.type);
    }

    query = query.order("created_at", {
      ascending: false,
    });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapProperty);
  } catch (error) {
    console.error("getProperties error", error);
    return [];
  }
};

export const getPropertyById = async (id: string) => {
  try {
    // Sélectionner tous les champs disponibles avec un SELECT * pour éviter les erreurs de colonnes manquantes
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("getPropertyById Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        id,
      });
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
    
    try {
      return mapProperty(data as SupabasePropertyRow);
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
      .select("id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status")
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
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status")
      .eq("validation_status", "approved")
      .eq("status", "disponible")
      .eq("location->>city", city)
      .eq("category", category)
      .neq("id", excludeId ?? "")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapProperty);
  } catch (error) {
    console.error("getSimilarProperties error", error);
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

