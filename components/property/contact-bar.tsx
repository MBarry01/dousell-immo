"use client";

import { useCallback } from "react";
import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { trackPropertyAction } from "@/app/(vitrine)/api/property-stats/actions";
import { useAuth } from "@/hooks/use-auth";
import { sendGTMEvent } from "@/lib/gtm";
import type { Property } from "@/types/property";

type ContactBarProps = {
  property: Property;
};

export const ContactBar = ({ property }: ContactBarProps) => {
  const { user } = useAuth();

  // Logique de contact selon les règles métier :
  // - Annonce PAYANTE (boost_visibilite) -> Afficher le numéro du propriétaire (contact_phone ou owner.phone)
  // - Annonce GRATUITE (mandat_confort) -> Afficher le numéro de l'Agence Doussel Immo
  const AGENCY_PHONE = "+221781385281"; // Numéro de Doussel Immo

  let displayPhone = AGENCY_PHONE; // Par défaut (Mandat gratuit)

  if (property.service_type === "boost_visibilite") {
    // Si payant, on priorise le numéro de l'annonce, sinon celui du profil
    const ownerPhone = property.contact_phone || property.owner?.phone;
    displayPhone = ownerPhone || AGENCY_PHONE; // Fallback sur agence si aucun numéro trouvé
  }

  const targetPhone = displayPhone;

  // Pour WhatsApp : utiliser le même numéro cible
  const whatsappNumber = targetPhone;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien ${property.title} (${property.id}) à ${property.location.city}.`
  )}`;

  const handleWhatsApp = useCallback(async () => {
    hapticFeedback.medium();
    analyticsEvents.contactWhatsApp(property.id, property.title);

    // GTM Tracking
    sendGTMEvent("contact_click", {
      method: "whatsapp",
      value: "mobile_bottom_bar",
      property_id: property.id,
      property_title: property.title
    });

    // Tracker le clic WhatsApp
    await trackPropertyAction({
      propertyId: property.id,
      actionType: "whatsapp_click",
      userId: user?.id || null,
    });
  }, [property.id, property.title, user?.id]);

  const handleCall = useCallback(async () => {
    hapticFeedback.medium();
    analyticsEvents.contactCall(property.id, property.title);

    // GTM Tracking
    sendGTMEvent("contact_click", {
      method: "phone",
      value: "mobile_bottom_bar",
      property_id: property.id,
      property_title: property.title
    });

    // Tracker le clic téléphone
    await trackPropertyAction({
      propertyId: property.id,
      actionType: "phone_click",
      userId: user?.id || null,
    });
  }, [property.id, property.title, user?.id]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl dark:bg-black/70">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
            Prix
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(property.price)}
          </p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            className="rounded-2xl border border-[#25D366]/20 bg-[#25D366] text-white hover:bg-[#20ba58]"
            asChild
            onClick={handleWhatsApp}
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-2xl border-gray-200 text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  asChild
                  onClick={handleCall}
                >
                  <a href={`tel:${targetPhone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Appeler
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{targetPhone === AGENCY_PHONE ? AGENCY_PHONE_DISPLAY : targetPhone}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

