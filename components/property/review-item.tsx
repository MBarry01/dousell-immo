"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { toast } from "sonner";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

import { toggleReviewReaction } from "@/services/reviewReactionService";
import type { Review } from "@/services/reviewService";

type ReviewItemProps = {
  review: Review;
  propertyId: string;
};

const ReviewItem = ({ review, propertyId }: ReviewItemProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localLikes, setLocalLikes] = useState(review.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(review.dislikes_count || 0);
  const [localUserReaction, setLocalUserReaction] = useState<
    "like" | "dislike" | null
  >(review.user_reaction || null);

  const handleReaction = (reactionType: "like" | "dislike") => {
    // Sauvegarder l'état précédent pour rollback en cas d'erreur
    const previousLikes = localLikes;
    const previousDislikes = localDislikes;
    const previousUserReaction = localUserReaction;

    // Optimistic update immédiat
    if (localUserReaction === reactionType) {
      // Si l'utilisateur clique sur la même réaction, on la supprime
      if (reactionType === "like") {
        setLocalLikes(Math.max(0, localLikes - 1));
      } else {
        setLocalDislikes(Math.max(0, localDislikes - 1));
      }
      setLocalUserReaction(null);
    } else if (localUserReaction) {
      // Si l'utilisateur change de réaction
      if (localUserReaction === "like") {
        setLocalLikes(Math.max(0, localLikes - 1));
        setLocalDislikes(localDislikes + 1);
      } else {
        setLocalDislikes(Math.max(0, localDislikes - 1));
        setLocalLikes(localLikes + 1);
      }
      setLocalUserReaction(reactionType);
    } else {
      // Nouvelle réaction
      if (reactionType === "like") {
        setLocalLikes(localLikes + 1);
      } else {
        setLocalDislikes(localDislikes + 1);
      }
      setLocalUserReaction(reactionType);
    }

    // Appel serveur
    startTransition(async () => {
      const result = await toggleReviewReaction(review.id, reactionType);

      if (!result.success) {
        // Rollback en cas d'erreur
        setLocalLikes(previousLikes);
        setLocalDislikes(previousDislikes);
        setLocalUserReaction(previousUserReaction);
        toast.error(result.error || "Erreur lors de la réaction");
      } else {
        // Rafraîchir la page pour synchroniser avec le serveur
        // Le serveur revalide déjà via revalidatePath, mais on force un refresh
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-white/20">
        {review.user_photo ? (
          <CldImageSafe
            src={review.user_photo}
            alt={review.user_name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600 dark:text-white/80">
            {review.user_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {review.user_name}
          </span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                  }`}
              />
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-500 dark:text-white/50">
            {new Date(review.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        {review.comment && (
          <p className="mb-3 text-sm text-gray-600 dark:text-white/60">
            {review.comment}
          </p>
        )}

        {/* Boutons Like/Dislike */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleReaction("like")}
            disabled={isPending}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${localUserReaction === "like"
                ? "bg-amber-500/20 text-amber-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
              }`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${localUserReaction === "like" ? "fill-current" : ""}`} />
            <span>{localLikes}</span>
          </button>
          <button
            onClick={() => handleReaction("dislike")}
            disabled={isPending}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${localUserReaction === "dislike"
                ? "bg-red-500/20 text-red-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
              }`}
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${localUserReaction === "dislike" ? "fill-current" : ""}`} />
            <span>{localDislikes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { ReviewItem };
export default ReviewItem;
