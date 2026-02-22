"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PropertyFormValues } from "@/lib/schemas/propertySchema";

type UpdatePropertyData = PropertyFormValues & {
  images: string[];
  virtual_tour_url?: string;
  contact_phone?: string;
};

import { smartGeocode } from "@/lib/geocoding";

export async function updateUserProperty(
  propertyId: string,
  data: UpdatePropertyData
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Utilisateur non authentifié." };
  }

  // Vérifier que le bien appartient à l'utilisateur
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("owner_id, validation_status")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas autorisé à modifier ce bien." };
  }

  const isTerrain = data.type === "terrain";

  // Préparer les specs selon le type
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

  // Mapper le type pour details
  // Note: on essaie d'être cohérent avec les valeurs attendues par le front
  const typeMap: Record<string, string> = {
    villa: "Villa",
    appartement: "Appartement",
    immeuble: "Immeuble",
    terrain: "Terrain",
    studio: "Studio",
    bureau: "Bureau",
  };

  const features = isTerrain
    ? {}
    : {
      hasGenerator: data.hasGenerator ?? false,
      hasWaterTank: data.hasWaterTank ?? false,
      security: data.security ?? false,
      pool: data.pool ?? false,
    };

  const detailsType = typeMap[data.type] ?? "Appartement";

  const details = isTerrain
    ? {
      type: "Terrain",
      year: new Date().getFullYear(),
      heating: "",
      juridique: data.juridique,
    }
    : {
      type: detailsType,
      year: new Date().getFullYear(),
      heating: "Climatisation",
    };

  // Géocodage pour mettre à jour les coordonnées (seulement si l'adresse a changé ?)
  // Pour la simulation, on le garde pour assurer la cohérence.
  let coords = { lat: 0, lng: 0 };
  try {
    coords = await smartGeocode(data.address, data.district, data.city);
  } catch (e) {
    console.error("Geocoding error:", e);
  }

  const updatePayload: any = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    property_type: data.type,
    location: {
      city: data.city,
      district: data.district,
      address: data.address,
      landmark: data.landmark || "",
      coords: coords.lat !== 0 ? coords : (property as any).location?.coords,
    },
    specs,
    features,
    details,
    images: data.images,
    contact_phone: data.contact_phone || null,
    virtual_tour_url: data.virtual_tour_url || null,
  };

  // Si l'annonce était rejetée, on la repasse en attente
  if (property.validation_status === "rejected") {
    updatePayload.validation_status = "pending";
    updatePayload.rejection_reason = null;
  }

  const { error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", propertyId);

  if (error) {
    console.error("❌ Error updating property:", error);
    return { error: `Erreur lors de la mise à jour: ${error.message}` };
  }

  revalidatePath("/compte/mes-biens");
  revalidatePath(`/biens/${propertyId}`);
  revalidatePath(`/compte/biens/${propertyId}`);

  return { success: true };
}
