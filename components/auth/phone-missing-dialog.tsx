"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { isValidPhoneNumber } from "react-phone-number-input";
import * as RPNInput from "react-phone-number-input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

export function PhoneMissingDialog() {
  const { user, loading } = useAuth();
  const [phoneValue, setPhoneValue] = useState<RPNInput.Value | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Vérifier si l'utilisateur connecté n'a pas de téléphone
  useEffect(() => {
    if (!loading && user) {
      const phone = user.user_metadata?.phone;
      // Vérifier si le téléphone est manquant ou vide
      if (!phone || phone.trim() === "") {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [user, loading]);

  const handleSubmit = async () => {
    // Validation
    if (!phoneValue || !isValidPhoneNumber(phoneValue)) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        data: {
          phone: phoneValue,
        },
      });

      if (error) {
        console.error("Error updating phone:", error);
        toast.error("Erreur lors de la mise à jour", {
          description: error.message,
        });
        setIsSubmitting(false);
        return;
      }

      // Forcer un refresh de la session pour mettre à jour les métadonnées
      await supabase.auth.getUser();

      // Succès
      toast.success("Numéro de téléphone enregistré !", {
        description: "Votre profil est maintenant complet.",
      });
      setIsOpen(false);
      setPhoneValue(undefined);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Une erreur inattendue s'est produite");
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ne pas afficher si l'utilisateur n'est pas connecté ou si le téléphone est présent
  if (loading || !user || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden border-white/10 bg-[#0b0f18] text-white"
        // Empêcher la fermeture par clic extérieur ou ESC
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Finalisez votre profil
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Pour contacter les agents et propriétaires à Dakar, nous avons besoin
            de votre numéro WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone-dialog" className="text-white/70">
              Téléphone
            </Label>
            <PhoneInput
              id="phone-dialog"
              value={phoneValue}
              onChange={(value) => setPhoneValue(value)}
              defaultCountry="SN"
              international
              disabled={isSubmitting}
              placeholder="Entrez votre numéro"
              onKeyDown={(e) => {
                if (e.key === "Enter" && phoneValue && isValidPhoneNumber(phoneValue)) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !phoneValue || !isValidPhoneNumber(phoneValue)}
            className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              "Enregistrer et Continuer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
