"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTeamPermission, getUserTeamContext } from "@/lib/team-permissions.server";
import { invalidatePropertyCaches, invalidateRentalCaches } from "@/lib/cache/invalidation";
import { checkFeatureAccess } from "@/lib/subscription/team-subscription";

// =====================================================
// TYPES
// =====================================================

export type TeamPropertyData = {
  type: string;
  title: string;
  description: string;
  price: number;
  category: "vente" | "location";
  address: string; // Adresse complète (quartier, ville, région)
  surface?: number;
  surfaceTotale?: number;
  juridique?: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  virtual_tour_url?: string;
  owner_id?: string; // Propriétaire externe (client)
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  location?: {
    lat: number;
    lon: number;
    city?: string;
    district?: string;
    region?: string;
  };
};

// =====================================================
// SCHÉMA DE VALIDATION
// =====================================================

const propertySchema = z.object({
  type: z.enum(["villa", "appartement", "terrain", "immeuble", "studio", "bureau"]),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  price: z.number().positive("Le prix doit être positif"),
  category: z.enum(["vente", "location"]),
  address: z.string().min(3, "L'adresse est requise"),
  surface: z.number().positive().optional(),
  surfaceTotale: z.number().positive().optional(),
  juridique: z.string().optional(),
  rooms: z.number().int().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  images: z.array(z.string()).min(1, "Au moins une image est requise"),
  virtual_tour_url: z.string().url().optional().or(z.literal("")),
  owner_id: z.string().uuid().optional(),
  owner_name: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal("")),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    city: z.string().optional(),
    district: z.string().optional(),
    region: z.string().optional()
  }).optional(),
});

// =====================================================
// UTILITAIRES
// =====================================================

function cleanVirtualTourUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return null;

  if (trimmedUrl.includes("<iframe")) {
    const match = trimmedUrl.match(/src="([^"]+)"/);
    if (match && match[1]) return match[1];
  }

  const youtubeWatchMatch = trimmedUrl.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeWatchMatch && youtubeWatchMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
  }

  const youtubeShortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtubeShortMatch && youtubeShortMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeShortMatch[1]}`;
  }

  return trimmedUrl;
}

// =====================================================
// ACTIONS
// =====================================================

/**
 * Récupérer les biens d'une équipe
 */
export async function getTeamProperties(teamId: string) {
  const permCheck = await requireTeamPermission(teamId, "properties.view");
  if (!permCheck.success) {
    return { error: permCheck.error, properties: [] };
  }

  const supabase = await createClient();

  // 1. Récupérer les propriétés
  const { data: propertiesData, error: propertiesError } = await supabase
    .from("properties")
    .select(`
      *,
      owner:profiles!owner_id(id, full_name, phone, avatar_url)
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (propertiesError) {
    console.error("❌ Erreur getTeamProperties (properties):", propertiesError);
    return { error: "Erreur lors de la récupération des biens", properties: [] };
  }

  const properties = propertiesData || [];
  const propertyIds = properties.map((p) => p.id);

  try {
    // 2. Récupérer les baux actifs avec les infos du locataire
    // Note: La table leases stocke directement tenant_name, tenant_email, tenant_phone (pas de tenant_id)
    const { data: leasesData } = await supabase
      .from("leases")
      .select("id, property_id, tenant_name, tenant_email, tenant_phone")
      .eq("status", "active")
      .in("property_id", propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']);

    if (leasesData && leasesData.length > 0) {
      // Créer une map pour accès rapide: property_id -> lease info
      const leaseMap = new Map(leasesData.map((l) => [l.property_id, l]));

      // 3. Fusionner les propriétés avec les infos du locataire
      const propertiesWithTenant = properties.map((property: any) => {
        const lease = leaseMap.get(property.id);

        return {
          ...property,
          // Le statut est déjà "loué" si le bien a un bail
          status: lease ? "loué" : property.status,
          tenant: lease ? {
            id: lease.id, // ID du bail
            full_name: lease.tenant_name,
            avatar_url: undefined, // Pas stocké dans leases
            payment_status: "up_to_date" as const // TODO: Calculer depuis rental_transactions
          } : undefined
        };
      });

      return { properties: propertiesWithTenant };
    }
  } catch (err) {
    console.warn("⚠️ Impossible de récupérer les locataires:", err);
  }

  return { properties: properties };
}

/**
 * Créer un bien pour l'équipe
 * @param publishMode - "publish" | "draft" | "schedule"
 * @param scheduledAt - Date ISO pour publication programmée
 */
export async function createTeamProperty(
  teamId: string,
  data: TeamPropertyData,
  publishMode: "publish" | "draft" | "schedule" = "publish",
  scheduledAt?: string
) {
  const permCheck = await requireTeamPermission(teamId, "properties.create");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  // ✅ CHECK FEATURE QUOTA
  const access = await checkFeatureAccess(teamId, "add_property");
  if (!access.allowed) {
    return {
      success: false,
      error: access.message,
      upgradeRequired: access.upgradeRequired,
      reason: access.reason
    };
  }

  // Validation plus souple pour les brouillons
  if (publishMode !== "draft") {
    const validation = propertySchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Données invalides" };
    }
  }

  const supabase = await createClient();

  // Déterminer si c'est un terrain
  const isTerrain = data.type === "terrain";

  // Préparer les specs
  const specs = isTerrain
    ? {
      surface: data.surfaceTotale ?? 0,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      dpe: "B" as const,
    }
    : {
      surface: data.surface ?? 0,
      rooms: data.rooms ?? 0,
      bedrooms: data.bedrooms ?? 0,
      bathrooms: data.bathrooms ?? 0,
      dpe: "B" as const,
    };

  const typeMap: Record<string, string> = {
    villa: "Villa",
    appartement: "Appartement",
    immeuble: "Immeuble",
    terrain: "Terrain",
    studio: "Studio",
    bureau: "Bureau",
  };

  // Déterminer le statut de validation selon le mode
  let validationStatus: "approved" | "pending" | "scheduled";
  if (publishMode === "publish") {
    validationStatus = "approved"; // Publié immédiatement
  } else if (publishMode === "schedule") {
    validationStatus = "scheduled"; // Programmé
  } else {
    validationStatus = "pending"; // Brouillon
  }

  // Extraire les infos de l'adresse au format "Région, Ville/Quartier, Sénégal" 
  // ou format libre via Autocomplete
  const addressParts = data.address.split(",").map((s) => s.trim());

  // Logique d'extraction intelligente
  let extractedCity = "";
  let extractedDistrict = "";

  // Priorité aux données structurées si disponibles
  if (data.location?.city) {
    extractedCity = data.location.city;
    extractedDistrict = data.location.district || "";
  } else if (addressParts.length >= 2) {
    // Si l'adresse finit par "Sénégal", on l'ignore pour trouver la ville
    const lastPart = addressParts[addressParts.length - 1];
    const isSenegal = lastPart?.toLowerCase() === "sénégal" || lastPart?.toLowerCase() === "senegal";

    if (isSenegal && addressParts.length >= 2) {
      // Format: "Région, Ville, Sénégal" -> Ville
      extractedCity = addressParts[addressParts.length - 2] || "";
      extractedDistrict = addressParts[0] || "";
    } else {
      // Format: "Région, Ville" (sans Sénégal)
      extractedCity = addressParts[addressParts.length - 1] || "";
      extractedDistrict = addressParts[0] || "";
    }
  } else {
    extractedCity = addressParts[0] || "";
  }

  const payload: Record<string, unknown> = {
    title: data.title,
    description: data.description || "",
    price: data.price,
    category: data.category,
    status: "disponible",
    team_id: teamId,
    created_by: permCheck.userId,
    owner_id: data.owner_id || permCheck.userId, // Default to creator for Vitrine sync
    is_agency_listing: true,
    validation_status: validationStatus,
    service_type: "mandat_confort",
    location: {
      city: extractedCity,
      district: extractedDistrict,
      address: data.address,
      landmark: "",
      coords: data.location ? { lat: data.location.lat, lng: data.location.lon } : { lat: 0, lng: 0 },
    },
    specs,
    features: {},
    details: isTerrain
      ? {
        type: "Terrain",
        year: new Date().getFullYear(),
        heating: "",
        juridique: data.juridique,
      }
      : {
        type: typeMap[data.type] ?? "Appartement",
        year: new Date().getFullYear(),
        heating: "Climatisation",
      },
    images: data.images || [],
    views_count: 0,
    virtual_tour_url: cleanVirtualTourUrl(data.virtual_tour_url),
    verification_status: "verified",
  };

  // Ajouter la date de publication programmée si applicable
  if (publishMode === "schedule" && scheduledAt) {
    payload.scheduled_publish_at = scheduledAt;
  }

  const { data: insertedProperty, error } = await supabase
    .from("properties")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("❌ Erreur createTeamProperty:", error);
    // Erreurs courantes avec messages explicites
    if (error.code === "42703") {
      return { success: false, error: "Migration requise: exécutez la migration SQL team_id dans Supabase" };
    }
    if (error.code === "42501" || error.message?.includes("permission")) {
      return { success: false, error: "Permission refusée. Vérifiez que vous êtes membre de l'équipe." };
    }
    if (error.code === "23503") {
      return { success: false, error: "Référence invalide (équipe ou utilisateur introuvable)" };
    }
    return { success: false, error: error.message || "Erreur lors de la création du bien" };
  }

  // Invalider les caches uniquement si publié
  if (publishMode === "publish") {
    await invalidatePropertyCaches(insertedProperty.id, extractedCity, {
      invalidateHomepage: true,
      invalidateSearch: true,
      invalidateDetail: true,
      invalidateOwner: false,
    });
    revalidatePath("/recherche");
  }

  revalidatePath("/gestion/biens");

  return { success: true, propertyId: insertedProperty.id, mode: publishMode };
}

/**
 * Mettre à jour un bien
 */
export async function updateTeamProperty(
  teamId: string,
  propertyId: string,
  data: Partial<TeamPropertyData>
) {
  const permCheck = await requireTeamPermission(teamId, "properties.edit");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const supabase = await createClient();

  // Vérifier que le bien appartient à l'équipe
  const { data: existingProperty } = await supabase
    .from("properties")
    .select("id, team_id, location")
    .eq("id", propertyId)
    .single();

  if (!existingProperty || existingProperty.team_id !== teamId) {
    return { success: false, error: "Bien non trouvé ou non autorisé" };
  }

  // Construire les champs à mettre à jour
  const updatePayload: Record<string, unknown> = {};

  if (data.title) updatePayload.title = data.title;
  if (data.description) updatePayload.description = data.description;
  if (data.price) updatePayload.price = data.price;
  if (data.category) updatePayload.category = data.category;
  if (data.images) updatePayload.images = data.images;
  if (data.virtual_tour_url !== undefined) {
    updatePayload.virtual_tour_url = cleanVirtualTourUrl(data.virtual_tour_url);
  }
  if (data.address) {
    // Format: "Quartier, Ville, Région"
    const addressParts = data.address.split(",").map((s) => s.trim());
    const extractedDistrict = addressParts[0] || "";
    const extractedCity = addressParts[1] || addressParts[0] || "";
    updatePayload.location = {
      city: data.location?.city || extractedCity,
      district: data.location?.district || extractedDistrict,
      address: data.address,
      landmark: "",
      coords: data.location ? { lat: data.location.lat, lng: data.location.lon } : { lat: 0, lng: 0 },
    };
  }
  if (data.owner_id) updatePayload.owner_id = data.owner_id;

  // Specs
  if (data.surface || data.rooms || data.bedrooms || data.bathrooms) {
    updatePayload.specs = {
      surface: data.surface ?? 0,
      rooms: data.rooms ?? 0,
      bedrooms: data.bedrooms ?? 0,
      bathrooms: data.bathrooms ?? 0,
      dpe: "B",
    };
  }

  // Si on modifie depuis le SaaS, le bien est considéré comme certifié
  updatePayload.verification_status = "verified";

  const { error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", propertyId);

  if (error) {
    console.error("❌ Erreur updateTeamProperty:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  // Invalider les caches
  const city = existingProperty.location?.city;
  await invalidatePropertyCaches(propertyId, city, {
    invalidateHomepage: true,
    invalidateSearch: true,
    invalidateDetail: true,
    invalidateOwner: false,
  });

  revalidatePath("/gestion/biens");
  revalidatePath(`/gestion/biens/${propertyId}`);
  revalidatePath(`/biens/${propertyId}`);

  return { success: true };
}

/**
 * Publier / Dépublier un bien
 */
export async function togglePropertyPublication(teamId: string, propertyId: string) {
  const permCheck = await requireTeamPermission(teamId, "properties.publish");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const supabase = await createClient();

  // Récupérer l'état actuel
  const { data: property } = await supabase
    .from("properties")
    .select("id, team_id, validation_status, verification_status, status, location")
    .eq("id", propertyId)
    .single();

  if (!property || property.team_id !== teamId) {
    return { success: false, error: "Bien non trouvé ou non autorisé" };
  }

  if (property.status === "loué") {
    return { success: false, error: "Impossible de publier un bien actuellement loué." };
  }

  // Toggle le statut
  const newStatus = property.validation_status === "approved" ? "pending" : "approved";

  const { error } = await supabase
    .from("properties")
    .update({
      validation_status: newStatus,
      // Si on publie depuis le SaaS, on certifie automatiquement
      verification_status: newStatus === "approved" ? "verified" : property.verification_status
    })
    .eq("id", propertyId);

  if (error) {
    console.error("❌ Erreur togglePropertyPublication:", error);
    return { success: false, error: "Erreur lors du changement de statut" };
  }

  // Invalider les caches
  await invalidatePropertyCaches(propertyId, property.location?.city, {
    invalidateHomepage: true,
    invalidateSearch: true,
    invalidateDetail: true,
    invalidateOwner: false,
  });

  revalidatePath("/gestion/biens");
  revalidatePath("/recherche");

  return {
    success: true,
    isPublished: newStatus === "approved",
    message: newStatus === "approved" ? "Bien publié sur la vitrine" : "Bien retiré de la vitrine",
  };
}

/**
 * Supprimer un bien
 */
export async function deleteTeamProperty(teamId: string, propertyId: string) {
  const permCheck = await requireTeamPermission(teamId, "properties.delete");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const supabase = await createClient();

  // Vérifier que le bien appartient à l'équipe
  const { data: property } = await supabase
    .from("properties")
    .select("id, team_id, location, images")
    .eq("id", propertyId)
    .single();

  if (!property || property.team_id !== teamId) {
    return { success: false, error: "Bien non trouvé ou non autorisé" };
  }

  // Supprimer le bien
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    console.error("❌ Erreur deleteTeamProperty:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  // Invalider les caches
  await invalidatePropertyCaches(propertyId, property.location?.city, {
    invalidateHomepage: true,
    invalidateSearch: true,
    invalidateDetail: true,
    invalidateOwner: false,
  });

  revalidatePath("/gestion/biens");

  return { success: true, message: "Bien supprimé avec succès" };
}

/**
 * Récupérer un bien par ID (pour édition)
 */
export async function getTeamPropertyById(teamId: string, propertyId: string) {
  const permCheck = await requireTeamPermission(teamId, "properties.view");
  if (!permCheck.success) {
    return { error: permCheck.error, property: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      owner:profiles!owner_id(id, full_name, phone, avatar_url, email)
    `)
    .eq("id", propertyId)
    .eq("team_id", teamId)
    .single();

  if (error || !data) {
    return { error: "Bien non trouvé", property: null };
  }

  return { property: data };
}

/**
 * Rechercher des propriétaires (pour le sélecteur)
 */
export async function searchOwners(query: string) {
  const teamContext = await getUserTeamContext();
  if (!teamContext) {
    return { owners: [] };
  }

  const supabase = await createClient();

  // Filtrer les propriétaires qui ont au moins une propriété ou un bail dans cette équipe
  // OU qui sont membres de l'équipe (si nécessaire)

  // Pour l'instant, on limite aux profils ayant une propriété dans l'équipe
  const { data: teamProperties } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("team_id", teamContext.team_id);

  const ownerIds = Array.from(new Set(teamProperties?.map(p => p.owner_id).filter(Boolean)));

  if (ownerIds.length === 0) {
    return { owners: [] };
  }

  let queryBuilder = supabase
    .from("profiles")
    .select("id, full_name, phone, email, avatar_url")
    .in("id", ownerIds);

  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data } = await queryBuilder.limit(10);

  return { owners: data || [] };
}

/**
 * Créer un nouveau propriétaire (client)
 *
 * SÉCURITÉ: Requiert la permission properties.create
 * Justification: Créer un propriétaire est lié à la création de biens,
 * donc nous utilisons la même permission pour cohérence.
 */
export async function createOwner(data: {
  full_name: string;
  phone: string;
  email?: string;
}) {
  // ✅ CORRECTION SÉCURITÉ: Vérification explicite de permission
  const teamContext = await getUserTeamContext();
  if (!teamContext) {
    return { success: false, error: "Non autorisé" };
  }

  const permCheck = await requireTeamPermission(teamContext.team_id, "properties.create");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const supabase = await createClient();

  // Pour créer un profil sans compte auth, on utilise un UUID généré
  const { data: newOwner, error } = await supabase
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      role: "particulier",
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Erreur createOwner:", error);
    return { success: false, error: "Erreur lors de la création du propriétaire" };
  }

  return { success: true, owner: newOwner };
}



/**
 * Rechercher des locataires (pour le sélecteur d'association)
 * Filtre strictement par les locataires ayant déjà un bail ou un lien avec l'équipe
 * pour garantir la confidentialité des données entre propriétaires.
 */
export async function searchTenants(query: string) {
  const teamContext = await getUserTeamContext();
  if (!teamContext) {
    return { owners: [] };
  }

  const supabase = await createClient();

  // 1. Récupérer les identifiants uniques des locataires existants pour cette équipe via les baux
  // On utilise email et téléphone comme clés de réconciliation car tenant_id n'est pas stocké dans leases
  const { data: linkedLeases } = await supabase
    .from("leases")
    .select("tenant_email, tenant_phone")
    .eq("team_id", teamContext.team_id);

  const emails = Array.from(new Set(linkedLeases?.map(l => l.tenant_email).filter(Boolean)));
  const phones = Array.from(new Set(linkedLeases?.map(l => l.tenant_phone).filter(Boolean)));

  // 2. Si aucun locataire existant, on ne retourne rien (sécurité maximale)
  // L'utilisateur devra utiliser "Créer un nouveau locataire" pour ajouter son premier client
  if (emails.length === 0 && phones.length === 0) {
    return { owners: [] };
  }

  // 3. Rechercher dans les profils qui correspondent à ces identifiants
  let queryBuilder = supabase
    .from("profiles")
    .select("id, full_name, phone, email, avatar_url");

  // Filtre d'identité (OR entre email/phone de l'équipe)
  const identityFilters = [];
  if (emails.length > 0) {
    identityFilters.push(`email.in.(${emails.map(e => `"${e}"`).join(",")})`);
  }
  if (phones.length > 0) {
    identityFilters.push(`phone.in.(${phones.map(p => `"${p}"`).join(",")})`);
  }

  if (identityFilters.length > 0) {
    queryBuilder = queryBuilder.or(identityFilters.join(","));
  }

  // Filtre de recherche textuelle (AND sur le résultat précédent)
  if (query && query.trim().length > 0) {
    // PostREST combine plusieurs paramètres 'or' avec un AND
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data } = await queryBuilder.limit(10);

  return { owners: data || [] };
}

/**
 * Associer un locataire à un bien (Création de bail simplifié)
 */
export async function associateTenant(
  teamId: string,
  propertyId: string,
  tenantId: string,
  startDate: string
) {
  const permCheck = await requireTeamPermission(teamId, "properties.edit");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  // ✅ CHECK FEATURE QUOTA
  const access = await checkFeatureAccess(teamId, "add_lease");
  if (!access.allowed) {
    return {
      success: false,
      error: access.message,
      upgradeRequired: access.upgradeRequired,
      reason: access.reason
    };
  }

  const supabase = await createClient();

  // Récupérer l'utilisateur connecté pour le owner_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utilisateur non connecté" };
  }

  // 1. Vérifier si le bien est déjà loué
  const { data: existingLease } = await supabase
    .from("leases")
    .select("id")
    .eq("property_id", propertyId)
    .eq("status", "active")
    .single();

  if (existingLease) {
    return { success: false, error: "Ce bien a déjà un bail actif." };
  }

  // 2. Récupérer les informations du locataire
  const { data: tenant } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", tenantId)
    .single();

  if (!tenant || !tenant.full_name) {
    return { success: false, error: "Locataire non trouvé" };
  }

  // 3. Récupérer les infos du bien (adresse et prix)
  const { data: property } = await supabase
    .from("properties")
    .select("price, location, owner_id")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return { success: false, error: "Bien non trouvé" };
  }

  const propertyAddress = property.location?.address
    || `${property.location?.district || ''}, ${property.location?.city || ''}`;

  // 4. Créer le bail avec le client admin (bypass RLS)
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("leases")
    .insert({
      property_id: propertyId,
      owner_id: property.owner_id, // Propriétaire du bien (peut être externe)
      team_id: teamId,
      tenant_name: tenant.full_name,
      tenant_email: tenant.email,
      tenant_phone: tenant.phone,
      property_address: propertyAddress,
      monthly_amount: property.price || 0,
      start_date: startDate,
      status: "active",
    });

  if (error) {
    console.error("❌ Erreur associateTenant:", error);
    return { success: false, error: `Erreur: ${error.message}` };
  }

  // 5. Mettre à jour le statut du bien ET le retirer de la vitrine publique
  await adminClient
    .from("properties")
    .update({
      status: "loué",
      validation_status: "pending" // Retire de la vitrine publique
    })
    .eq("id", propertyId);

  revalidatePath("/gestion/biens");
  revalidatePath("/gestion"); // Refresh dashboard KPIs

  // Invalider le cache Redis des baux
  await invalidateRentalCaches(user.id);

  return { success: true };
}

// =====================================================
// GÉNÉRATION DE DESCRIPTION IA (SEO OPTIMISÉ)
// =====================================================

type AIDescriptionParams = {
  type: string;
  category: "vente" | "location";
  city: string;
  district?: string;
  price: number;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  title?: string;
};

export async function generateSEODescription(params: AIDescriptionParams): Promise<{
  success: boolean;
  description?: string;
  title?: string;
  error?: string;
}> {
  // ✅ CORRECTION SÉCURITÉ: Vérifier les permissions avant tout appel IA
  const teamContext = await getUserTeamContext();
  if (!teamContext) {
    return { success: false, error: "Non autorisé" };
  }

  const permCheck = await requireTeamPermission(teamContext.team_id, "properties.create");
  if (!permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  // ✅ CORRECTION SÉCURITÉ: Rate limiting Redis (20 appels/heure par équipe)
  const { checkAIRateLimit } = await import('@/lib/rate-limit');
  const rateLimit = await checkAIRateLimit(teamContext.team_id);

  if (!rateLimit.allowed) {
    // Calculer le temps restant en minutes
    const resetIn = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
    const minutes = resetIn > 1 ? `${resetIn} minutes` : `${resetIn} minute`;

    console.warn(`🚫 AI Rate limit blocked for team ${teamContext.team_id}`);

    return {
      success: false,
      error: `Limite d'appels IA atteinte (20/heure). Réessayez dans ${minutes}.`,
    };
  }

  // Log l'appel autorisé avec compteur
  console.log(`🤖 AI Request ${20 - rateLimit.remaining}/20 - Team: ${teamContext.team_id}, User: ${permCheck.userId}`);

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.error("❌ OPENAI_API_KEY non configurée");
      return {
        success: false,
        error: "La génération IA n'est pas configurée. Veuillez contacter l'administrateur.",
      };
    }

    // Labels
    const categoryLabel = params.category === "vente" ? "à vendre" : "à louer";
    const typeLabel = params.type.charAt(0).toUpperCase() + params.type.slice(1);
    const locationLabel = params.district
      ? `${params.district}, ${params.city}`
      : params.city;

    const specs = [];
    if (params.surface) specs.push(`${params.surface} m²`);
    if (params.rooms) specs.push(`${params.rooms} pièces`);
    if (params.bedrooms) specs.push(`${params.bedrooms} chambre(s)`);
    if (params.bathrooms) specs.push(`${params.bathrooms} salle(s) de bain`);

    const specsText = specs.length > 0 ? specs.join(", ") : "Caractéristiques non spécifiées";
    const priceFormatted = params.price.toLocaleString("fr-SN");

    const prompt = `Tu es un expert en rédaction immobilière et SEO au Sénégal. Génère une description professionnelle et optimisée pour le référencement.

BIEN IMMOBILIER:
- Type: ${typeLabel} ${categoryLabel}
- Localisation: ${locationLabel}, Sénégal
- Caractéristiques: ${specsText}
- Prix: ${priceFormatted} FCFA${params.category === "location" ? " / mois" : ""}

OBJECTIFS SEO:
1. Inclure naturellement des mots-clés pertinents: "${typeLabel} ${categoryLabel} ${params.city}", "immobilier ${params.city}", "location/vente ${params.district || params.city}"
2. Structure optimisée avec paragraphes courts (2-3 phrases max)
3. Appel à l'action engageant à la fin

FORMAT REQUIS (JSON):
{
  "title": "Titre SEO accrocheur (max 70 caractères, inclut type + localisation)",
  "description": "Description de 150-200 mots, 3 paragraphes:\\n\\n1. Introduction avec localisation et type de bien\\n\\n2. Caractéristiques et atouts principaux\\n\\n3. Conclusion avec appel à l'action"
}

RÈGLES:
- Ton professionnel mais chaleureux, adapté au marché sénégalais
- Mentionne les avantages du quartier si pertinent (${params.district || "centre-ville"})
- N'invente pas de caractéristiques non mentionnées
- Évite le bourrage de mots-clés, reste naturel
- Écris en français

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es un rédacteur immobilier professionnel spécialisé au Sénégal, expert en SEO.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erreur OpenAI:", response.status, errorData);
      return {
        success: false,
        error: "Erreur lors de la génération. Veuillez réessayer.",
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        success: false,
        error: "La description générée est vide. Veuillez réessayer.",
      };
    }

    // Parser le JSON
    try {
      const parsed = JSON.parse(content);
      console.log("✅ Description SEO générée avec succès");
      return {
        success: true,
        title: parsed.title,
        description: parsed.description,
      };
    } catch {
      // Si le parsing échoue, retourner le contenu brut comme description
      console.log("⚠️ Parsing JSON échoué, utilisation du contenu brut");
      return {
        success: true,
        description: content,
      };
    }
  } catch (error) {
    console.error("❌ Erreur inattendue dans generateSEODescription:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la génération.",
    };
  }
}
