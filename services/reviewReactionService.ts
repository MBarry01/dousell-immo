"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ReactionType = "like" | "dislike";

/**
 * Ajoute ou met à jour une réaction (like/dislike) sur un avis
 */
export async function toggleReviewReaction(
  reviewId: string,
  reactionType: ReactionType
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Vous devez être connecté pour réagir à un avis",
    };
  }

  try {
    // Vérifier que l'avis existe
    const { data: reviewExists, error: reviewCheckError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewCheckError || !reviewExists) {
      return {
        success: false,
        error: "Cet avis n'existe pas",
      };
    }

    // Vérifier si l'utilisateur a déjà réagi à cet avis
    const { data: existingReaction, error: fetchError } = await supabase
      .from("review_reactions")
      .select("id, reaction_type")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      // Si la table n'existe pas encore (code PGRST205 pour Supabase), retourner une erreur informative
      if (
        fetchError.code === "PGRST205" ||
        fetchError.code === "42P01" ||
        fetchError.message?.includes("does not exist") ||
        fetchError.message?.includes("schema cache") ||
        fetchError.message?.includes("could not find the table")
      ) {
        console.warn(
          "Review reactions table does not exist yet. Please run the migration: supabase/migrations/20251120191336_add_review_reactions.sql",
          fetchError
        );
        return {
          success: false,
          error: "La table 'review_reactions' n'existe pas encore. Veuillez exécuter la migration SQL dans Supabase Dashboard → SQL Editor.",
        };
      }
      console.error("toggleReviewReaction fetch error:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      return {
        success: false,
        error: `Erreur lors de la vérification de la réaction: ${fetchError.message || "Erreur inconnue"}`,
      };
    }

    // Si l'utilisateur clique sur le même type de réaction, on supprime la réaction
    if (existingReaction?.reaction_type === reactionType) {
      const { error: deleteError } = await supabase
        .from("review_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        // Vérifier si la table n'existe pas
        if (
          deleteError.code === "PGRST205" ||
          deleteError.code === "42P01" ||
          deleteError.message?.includes("does not exist") ||
          deleteError.message?.includes("schema cache") ||
          deleteError.message?.includes("could not find the table")
        ) {
          return {
            success: false,
            error: "La table 'review_reactions' n'existe pas encore. Veuillez exécuter la migration SQL dans Supabase Dashboard → SQL Editor.",
          };
        }
        console.error("toggleReviewReaction delete error:", deleteError);
        return {
          success: false,
          error: "Erreur lors de la suppression de la réaction",
        };
      }

      // Revalider la page
      const { data: review } = await supabase
        .from("reviews")
        .select("property_id")
        .eq("id", reviewId)
        .single();

      if (review?.property_id) {
        revalidatePath(`/biens/${review.property_id}`);
      }

      return { success: true };
    }

    // Si une réaction existe mais avec un type différent, on la met à jour
    if (existingReaction) {
      const { error: updateError } = await supabase
        .from("review_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existingReaction.id);

      if (updateError) {
        // Vérifier si la table n'existe pas
        if (
          updateError.code === "PGRST205" ||
          updateError.code === "42P01" ||
          updateError.message?.includes("does not exist") ||
          updateError.message?.includes("schema cache") ||
          updateError.message?.includes("could not find the table")
        ) {
          return {
            success: false,
            error: "La table 'review_reactions' n'existe pas encore. Veuillez exécuter la migration SQL dans Supabase Dashboard → SQL Editor.",
          };
        }
        console.error("toggleReviewReaction update error:", updateError);
        return {
          success: false,
          error: "Erreur lors de la mise à jour de la réaction",
        };
      }
    } else {
      // Sinon, on crée une nouvelle réaction
      const { error: insertError } = await supabase
        .from("review_reactions")
        .insert({
          review_id: reviewId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      if (insertError) {
        // Vérifier si la table n'existe pas
        if (
          insertError.code === "PGRST205" ||
          insertError.code === "42P01" ||
          insertError.message?.includes("does not exist") ||
          insertError.message?.includes("schema cache") ||
          insertError.message?.includes("could not find the table")
        ) {
          console.error("Review reactions table does not exist:", insertError);
          return {
            success: false,
            error: "La table 'review_reactions' n'existe pas encore. Veuillez exécuter la migration SQL dans Supabase Dashboard → SQL Editor.",
          };
        }
        console.error("toggleReviewReaction insert error:", insertError);
        return {
          success: false,
          error: "Erreur lors de l'ajout de la réaction",
        };
      }
    }

    // Revalider la page pour mettre à jour les données
    const { data: review } = await supabase
      .from("reviews")
      .select("property_id")
      .eq("id", reviewId)
      .single();

    if (review?.property_id) {
      // Revalider la page pour rafraîchir les données
      revalidatePath(`/biens/${review.property_id}`);
      // Revalider aussi la route pour forcer le refresh
      revalidatePath(`/biens/${review.property_id}`, "page");
    }

    return { success: true };
  } catch (error) {
    console.error("toggleReviewReaction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la gestion de la réaction",
    };
  }
}

