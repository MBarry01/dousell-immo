"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAnyRole } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Récupère tous les biens pour l'admin (pas seulement approuvés)
 */
export async function getAllPropertiesForAdmin() {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, title, description, price, category, status, location, specs, details, features, images, agent, created_at, validation_status"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all properties:", error);
      return [];
    }

    return (
      data?.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status ?? "disponible",
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        createdAt: new Date(p.created_at),
        validationStatus: p.validation_status,
        location: p.location,
      })) ?? []
    );
  } catch (error) {
    console.error("Error in getAllPropertiesForAdmin:", error);
    return [];
  }
}

/**
 * Supprime un bien
 */
export async function deleteProperty(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      console.error("Error deleting property:", error);
      return {
        success: false,
        error: "Impossible de supprimer le bien.",
      };
    }

    // Revalider les pages concernées
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin");
    revalidatePath("/recherche");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteProperty:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
    };
  }
}

