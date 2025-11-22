"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSearchAlert } from "@/app/compte/alertes/actions";
import type { PropertyFilters } from "@/services/propertyService";

const alertSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
});

type AlertFormData = z.infer<typeof alertSchema>;

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  filters,
}: CreateAlertDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: AlertFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createSearchAlert({
        name: data.name,
        filters,
      });

      if (result.error) {
        toast.error("Erreur", {
          description: result.error,
        });
        return;
      }

      toast.success("Alerte créée", {
        description: `Votre alerte "${data.name}" a été créée avec succès.`,
      });

      reset();
      onOpenChange(false);

      // Si on était sur la page de recherche avec ?alert=create, rediriger vers les alertes
      if (searchParams.get("alert") === "create") {
        router.push("/compte/alertes");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue s'est produite",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFilters = () => {
    const parts: string[] = [];
    // Utiliser 'q' pour la recherche textuelle (location)
    const searchQuery = (filters as any).q || filters.location;
    if (searchQuery && searchQuery.trim()) {
      parts.push(searchQuery.trim());
    }
    if (filters.category) {
      parts.push(filters.category === "vente" ? "Achat" : "Location");
    }
    if (filters.city) {
      parts.push(filters.city);
    }
    if (filters.type) {
      parts.push(filters.type);
    }
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = [
        filters.minPrice ? `${filters.minPrice.toLocaleString()} FCFA` : "",
        filters.maxPrice ? `${filters.maxPrice.toLocaleString()} FCFA` : "",
      ]
        .filter(Boolean)
        .join(" - ");
      if (priceRange) {
        parts.push(priceRange);
      }
    }
    if (filters.rooms) {
      parts.push(`${filters.rooms} pièce${filters.rooms > 1 ? "s" : ""}`);
    }
    if (filters.bedrooms) {
      parts.push(`${filters.bedrooms} chambre${filters.bedrooms > 1 ? "s" : ""}`);
    }
    if (filters.hasBackupGenerator) {
      parts.push("Groupe électrogène");
    }
    if (filters.hasWaterTank) {
      parts.push("Citerne d'eau");
    }
    return parts.length > 0 ? parts.join(", ") : "Tous les biens (aucun filtre)";
  };

  const hasActiveFilters = (() => {
    // Vérifier si au moins un filtre a une valeur significative
    return !!(
      ((filters as any).q && (filters as any).q.trim()) ||
      filters.location ||
      filters.category ||
      filters.city ||
      filters.type ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.rooms ||
      filters.bedrooms ||
      filters.hasBackupGenerator ||
      filters.hasWaterTank
    );
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#05080c] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-amber-500" />
            Créer une alerte de recherche
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Recevez une notification quand de nouveaux biens correspondent à vos
            critères de recherche.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nom de l'alerte */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Nom de l&apos;alerte
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Appartement à Dakar"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/20"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Critères de recherche */}
          <div className="space-y-2">
            <Label className="text-white">Critères de recherche</Label>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/80">{formatFilters()}</p>
              {!hasActiveFilters && (
                <p className="mt-2 text-xs text-white/50 italic">
                  Vous recevrez une notification pour tous les nouveaux biens publiés.
                </p>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              className="flex-1 border border-white/10 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-500 text-black hover:bg-amber-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Créer l&apos;alerte
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

