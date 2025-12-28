import { supabase } from "@/lib/supabase";

export type Review = {
  id: string;
  property_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string | null;
  user_name: string;
  user_photo: string | null;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  dislikes_count?: number;
  user_reaction?: "like" | "dislike" | null;
};

export type ReviewStats = {
  average_rating: number;
  total_reviews: number;
};

export type ReviewReaction = {
  id: string;
  review_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string;
};

export type CreateReviewData = {
  property_id: string;
  rating: number;
  comment?: string;
  user_name: string;
  user_photo?: string;
};

/**
 * Récupère tous les avis d'un bien avec les stats de likes/dislikes
 */
export async function getPropertyReviews(
  propertyId: string,
  currentUserId?: string
): Promise<Review[]> {
  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      // Si la table n'existe pas encore (code PGRST205 pour Supabase), retourner un tableau vide
      if (
        reviewsError.code === "PGRST205" ||
        reviewsError.code === "42P01" ||
        reviewsError.message?.includes("does not exist") ||
        reviewsError.message?.includes("schema cache")
      ) {
        console.warn(
          "Reviews table does not exist yet. Please run the migration: supabase/migrations/20251120190915_create_reviews.sql"
        );
        return [];
      }
      console.error("getPropertyReviews Supabase error:", {
        message: reviewsError.message,
        code: reviewsError.code,
        details: reviewsError.details,
        hint: reviewsError.hint,
        propertyId,
      });
      return [];
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Récupérer les stats de likes/dislikes pour chaque avis
    const reviewIds = reviews.map((r) => r.id);

    // Récupérer toutes les réactions (si la table existe)
    let reactions: ReviewReaction[] = [];
    const { data: reactionsData, error: reactionsError } = await supabase
      .from("review_reactions")
      .select("*")
      .in("review_id", reviewIds);

    if (reactionsError) {
      // Si la table n'existe pas encore, ignorer l'erreur
      if (
        reactionsError.code === "PGRST205" ||
        reactionsError.code === "42P01" ||
        reactionsError.message?.includes("does not exist") ||
        reactionsError.message?.includes("schema cache")
      ) {
        // Table n'existe pas encore, continuer sans réactions
        reactions = [];
      } else {
        console.error("getPropertyReviews reactions error:", reactionsError);
        reactions = [];
      }
    } else {
      reactions = reactionsData ?? [];
    }

    // Compter les likes/dislikes et trouver la réaction de l'utilisateur courant
    const reactionsByReview = reactions.reduce(
      (acc, reaction) => {
        const reviewId = reaction.review_id;
        if (!acc[reviewId]) {
          acc[reviewId] = { likes: 0, dislikes: 0, userReaction: null };
        }
        if (reaction.reaction_type === "like") {
          acc[reviewId].likes++;
        } else if (reaction.reaction_type === "dislike") {
          acc[reviewId].dislikes++;
        }
        if (currentUserId && reaction.user_id === currentUserId) {
          acc[reviewId].userReaction = reaction.reaction_type;
        }
        return acc;
      },
      {} as Record<
        string,
        { likes: number; dislikes: number; userReaction: "like" | "dislike" | null }
      >
    );

    // Combiner les avis avec leurs stats
    return reviews.map((review) => {
      const stats = reactionsByReview[review.id] || {
        likes: 0,
        dislikes: 0,
        userReaction: null,
      };
      return {
        ...review,
        likes_count: stats.likes,
        dislikes_count: stats.dislikes,
        user_reaction: stats.userReaction,
      } as Review;
    });
  } catch (error) {
    console.error("getPropertyReviews error:", {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      propertyId,
    });
    return [];
  }
}

/**
 * Récupère les statistiques d'avis d'un bien (moyenne et nombre)
 */
export async function getPropertyReviewStats(
  propertyId: string
): Promise<ReviewStats> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("property_id", propertyId);

    if (error) {
      // Si la table n'existe pas encore (code PGRST205 pour Supabase), retourner des stats par défaut
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("schema cache")
      ) {
        console.warn(
          "Reviews table does not exist yet. Please run the migration: supabase/migrations/20251120190915_create_reviews.sql"
        );
        return {
          average_rating: 0,
          total_reviews: 0,
        };
      }
      console.error("getPropertyReviewStats Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        propertyId,
      });
      // Ne pas throw, retourner des stats par défaut pour ne pas bloquer la page
      return {
        average_rating: 0,
        total_reviews: 0,
      };
    }

    const reviews = (data ?? []) as { rating: number }[];
    const total_reviews = reviews.length;

    if (total_reviews === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
      };
    }

    const sum_ratings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average_rating = Math.round((sum_ratings / total_reviews) * 10) / 10;

    return {
      average_rating,
      total_reviews,
    };
  } catch (error) {
    console.error("getPropertyReviewStats error:", {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      propertyId,
    });
    // Retourner des stats par défaut en cas d'erreur pour ne pas bloquer la page
    return {
      average_rating: 0,
      total_reviews: 0,
    };
  }
}

/**
 * Crée un nouvel avis (nécessite une session utilisateur)
 */
export async function createReview(
  reviewData: CreateReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Vous devez être connecté pour laisser un avis",
      };
    }

    // Vérifier que l'utilisateur n'a pas déjà laissé un avis pour ce bien
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("property_id", reviewData.property_id)
      .eq("user_id", user.id)
      .single();

    if (existingReview) {
      return {
        success: false,
        error: "Vous avez déjà laissé un avis pour ce bien",
      };
    }

    // Créer l'avis
    const { error } = await supabase.from("reviews").insert({
      property_id: reviewData.property_id,
      user_id: user.id,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
      user_name: reviewData.user_name,
      user_photo: reviewData.user_photo || null,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("createReview error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur lors de la création de l'avis",
    };
  }
}

/**
 * Met à jour un avis existant (nécessite une session utilisateur)
 */
export async function updateReview(
  reviewId: string,
  updates: { rating?: number; comment?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Vous devez être connecté pour modifier un avis",
      };
    }

    // Vérifier que l'avis appartient à l'utilisateur
    const { data: review } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (!review || review.user_id !== user.id) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cet avis",
      };
    }

    // Mettre à jour l'avis
    const { error } = await supabase
      .from("reviews")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("updateReview error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'avis",
    };
  }
}

/**
 * Supprime un avis (nécessite une session utilisateur)
 */
export async function deleteReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Vous devez être connecté pour supprimer un avis",
      };
    }

    // Vérifier que l'avis appartient à l'utilisateur
    const { data: review } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (!review || review.user_id !== user.id) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cet avis",
      };
    }

    // Supprimer l'avis
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("deleteReview error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur lors de la suppression de l'avis",
    };
  }
}

