"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PropertyFormValues } from "@/lib/schemas/propertySchema";

type UpdatePropertyData = PropertyFormValues & {
  images: string[];
};

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
  const typeMap: Record<string, "Appartement" | "Maison" | "Studio"> = {
    villa: "Maison",
    appartement: "Appartement",
    immeuble: "Appartement",
    terrain: "Appartement",
  };

  const features = isTerrain
    ? {}
    : {
        hasGenerator: data.hasGenerator ?? false,
        hasWaterTank: data.hasWaterTank ?? false,
        security: data.security ?? false,
        pool: data.pool ?? false,
      };

  const details = isTerrain
    ? {
        type: "Appartement" as const,
        year: new Date().getFullYear(),
        heating: "",
        juridique: data.juridique,
      }
    : {
        type: typeMap[data.type] ?? "Appartement",
        year: new Date().getFullYear(),
        heating: "Climatisation",
      };

  const updatePayload: {
    title: string;
    description: string;
    price: number;
    category: string;
    location: {
      city: string;
      district: string;
      address: string;
      landmark: string;
      coords: { lat: number; lng: number };
    };
    specs: typeof specs;
    features: typeof features;
    details: typeof details;
    images: string[];
    validation_status?: string;
    rejection_reason?: null;
  } = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    location: {
      city: data.city,
      district: data.district,
      address: data.address,
      landmark: data.landmark,
      coords: { lat: 0, lng: 0 },
    },
    specs,
    features,
    details,
    images: data.images,
  };

  // Si c'était un bien refusé, le repasser en pending pour nouvelle validation
  if (property.validation_status === "rejected") {
    updatePayload.validation_status = "pending";
    updatePayload.rejection_reason = null; // Effacer le motif de refus
  }

  const { error } = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", propertyId);

  if (error) {
    console.error("Error updating property:", error);
    return { error: "Erreur lors de la mise à jour de l'annonce" };
  }

  revalidatePath("/compte/mes-biens");
  revalidatePath(`/biens/${propertyId}`);

  return { success: true };
}
