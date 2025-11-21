"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Marquer un bien comme vendu/loué
 */
export async function markPropertyAsSold(propertyId: string) {
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
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas autorisé à modifier ce bien." };
  }

  const { error } = await supabase
    .from("properties")
    .update({ status: "vendu" })
    .eq("id", propertyId);

  if (error) {
    console.error("Error marking property as sold:", error);
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/compte/mes-biens");
  return { success: true };
}

/**
 * Supprimer un bien
 */
export async function deleteUserProperty(propertyId: string) {
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
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas autorisé à supprimer ce bien." };
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    console.error("Error deleting property:", error);
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath("/compte/mes-biens");
  return { success: true };
}

