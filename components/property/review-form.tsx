"use client";

import { useState, useTransition } from "react";
import { Star, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { createReviewAction } from "@/app/biens/[id]/actions";

type ReviewFormProps = {
  propertyId: string;
  onReviewSubmitted?: () => void;
};

export const ReviewForm = ({ propertyId, onReviewSubmitted }: ReviewFormProps) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Vous devez être connecté pour laisser un avis");
      router.push("/login?redirect=/biens/" + propertyId);
      return;
    }

    if (!comment.trim()) {
      toast.error("Veuillez ajouter un commentaire");
      return;
    }

    setIsSubmitting(true);
    
    startTransition(async () => {
      const result = await createReviewAction(propertyId, rating, comment);

      if (result.success) {
        toast.success("Votre avis a été ajouté avec succès !");
        setComment("");
        setRating(5);
        onReviewSubmitted?.();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout de l'avis");
      }
      
      setIsSubmitting(false);
    });
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-white/10 dark:bg-white/5">
        <p className="mb-4 text-gray-600 dark:text-white/70">
          Connectez-vous pour laisser un avis
        </p>
        <Button
          onClick={() => router.push("/login?redirect=/biens/" + propertyId)}
          className="rounded-xl"
        >
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          Votre note
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            {rating === 5
              ? "Excellent"
              : rating === 4
                ? "Très bien"
                : rating === 3
                  ? "Bien"
                  : rating === 2
                    ? "Passable"
                    : "Médiocre"}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          Votre commentaire
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce bien..."
          rows={4}
          className="w-full rounded-xl border-gray-300 bg-white dark:border-white/20 dark:bg-white/5 dark:text-white"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
          {comment.length}/500 caractères
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || isPending || !comment.trim()}
        className="w-full rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
      >
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting || isPending ? "Envoi..." : "Publier l'avis"}
      </Button>
    </form>
  );
};

