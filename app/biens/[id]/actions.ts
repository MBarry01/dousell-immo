"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function createReviewAction(
  propertyId: string,
  rating: number,
  comment: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Vous devez être connecté pour laisser un avis",
    };
  }

  // Valider la note
  if (rating < 1 || rating > 5) {
    return {
      success: false,
      error: "La note doit être entre 1 et 5",
    };
  }

  // Vérifier que l'utilisateur n'a pas déjà laissé un avis pour ce bien
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingReview) {
    return {
      success: false,
      error: "Vous avez déjà laissé un avis pour ce bien",
    };
  }

  const userEmail = user.email || "";
  const userName = userEmail.split("@")[0] || "Utilisateur";
  const userPhoto = user.user_metadata?.avatar_url || null;

  // Créer l'avis
  const { error } = await supabase.from("reviews").insert({
    property_id: propertyId,
    user_id: user.id,
    rating,
    comment: comment.trim() || null,
    user_name: userName,
    user_photo: userPhoto,
  });

  if (error) {
    console.error("createReview error", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'avis",
    };
  }

  // Revalider la page pour afficher le nouvel avis
  revalidatePath(`/biens/${propertyId}`);

  return { success: true };
}


