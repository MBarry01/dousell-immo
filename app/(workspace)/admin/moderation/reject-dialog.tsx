"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { moderatePropertyWithReason } from "./actions";

type RejectDialogProps = {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const rejectionReasons = [
  "Photos floues ou insuffisantes",
  "Prix irréaliste",
  "Preuve de paiement invalide",
  "Informations manquantes ou incorrectes",
  "Contenu inapproprié",
  "Doublon d'annonce",
  "Autre",
];

export function RejectDialog({
  propertyId,
  open,
  onOpenChange,
  onSuccess,
}: RejectDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Veuillez sélectionner un motif de refus");
      return;
    }

    const reason = selectedReason === "Autre" ? customReason : selectedReason;

    if (!reason || reason.trim().length < 5) {
      toast.error("Veuillez fournir un motif de refus détaillé");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await moderatePropertyWithReason(propertyId, reason);
      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Annonce refusée", {
          description: "Le propriétaire a été notifié du motif de refus.",
        });
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du refus de l'annonce");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Refuser l&apos;annonce
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Veuillez indiquer le motif de refus. Cette information sera visible
            par le propriétaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Motif de refus</Label>
            <div className="space-y-2">
              {rejectionReasons.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 cursor-pointer hover:bg-muted transition-colors"
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm text-foreground">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Autre" && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Précisez le motif
              </Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Décrivez le motif de refus..."
                className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-full"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            {isSubmitting ? "Traitement..." : "Confirmer le refus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

