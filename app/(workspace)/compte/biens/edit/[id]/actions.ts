"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PropertyFormValues } from "@/lib/schemas/propertySchema";

type UpdatePropertyData = PropertyFormValues & {
  images: string[];
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
    villa: "Maison",
    appartement: "Appartement",
    immeuble: "Immeuble",
    terrain: "Terrain",
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

  // Géocodage pour mettre à jour les coordonnées
  const coords = await smartGeocode(data.address, data.district, data.city);

  const updatePayload = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    property_type: data.type, // Mise à jour explicite du type (colonne property_type dans la DB)
    location: {
      city: data.city,
      district: data.district,
      address: data.address,
      landmark: data.landmark || "",
      coords: coords,
    },
    specs,
    features,
    details,
    images: data.images,
    ...(property.validation_status === "rejected"
      ? { validation_status: "pending", rejection_reason: null }
      : {}),
  };

  const { error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", propertyId);

  if (error) {
    console.error("Error updating property:", error);
    return { error: `Erreur DB: ${error.message} (${error.details || ''})` };
  }

  revalidatePath("/compte/mes-biens");
  revalidatePath(`/biens/${propertyId}`);

  return { success: true };
}
