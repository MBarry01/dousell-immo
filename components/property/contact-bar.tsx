"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Calendar } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { trackPropertyAction } from "@/app/(vitrine)/api/property-stats/actions";
import { useAuth } from "@/hooks/use-auth";
import { sendGTMEvent } from "@/lib/gtm";
import type { Property } from "@/types/property";

type ContactBarProps = {
  property: Property;
};

export const ContactBar = ({ property }: ContactBarProps) => {
  const { user } = useAuth();
  const router = useRouter();

  // Logique de contact selon les règles métier :
  // Résolution du numéro de contact : équipe > contact_phone > owner > fallback
  const resolvedPhone = property.team?.company_phone
    || property.contact_phone
    || property.owner?.phone
    || property.agent?.phone
    || AGENCY_PHONE;

  const phoneLink = resolvedPhone;

  // Pour WhatsApp : utiliser le même numéro cible
  const whatsappNumber = resolvedPhone;
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien ${property.title} (${property.id}) à ${property.location.city}.`
  )}`;

  const handleWhatsAppClick = useCallback(async () => {
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

  const handlePhoneClick = useCallback(async () => {
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

  /**
   * Gère le clic sur le bouton "Demander une visite" (Mobile)
   */
  const handleRequestVisit = () => {
    const propertyInfo = `Je suis intéressé(e) par le bien "${property.title}" (${formatCurrency(property.price)}) situé à ${property.location.address || property.location.city}${property.location.landmark ? `, ${property.location.landmark}` : ""}.`;

    const params = new URLSearchParams({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price.toString(),
      propertyLocation: `${property.location.address || property.location.city}${property.location.landmark ? `, ${property.location.landmark}` : ""}`,
      projectType: property.transaction === "location" ? "location" : "achat",
      message: propertyInfo,
    });

    router.push(`/planifier-visite?${params.toString()}`);
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl dark:bg-black/70">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">
            Prix
          </p>
          <p className="flex items-baseline gap-1 text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(property.price)}
            {property.transaction === "location" && (
              <span className="text-xs font-normal text-gray-500 dark:text-white/40">/ mois</span>
            )}
          </p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm no-select transition-all hover:bg-white/10 hover:shadow-md"
                  onClick={handleRequestVisit}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => hapticFeedback.light()}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <Calendar className="h-4 w-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Planifier une visite</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            className="flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-bold text-white shadow-lg no-select transition-all hover:bg-[#25D366] hover:shadow-xl"
            onClick={handleWhatsAppClick}
            asChild
          >
            <motion.a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => hapticFeedback.medium()}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </motion.a>
          </Button>

          <Button
            className="flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-sm font-bold text-white shadow-sm no-select transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-md"
            asChild
            onClick={handlePhoneClick}
          >
            <motion.a
              href={`tel:${phoneLink}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => hapticFeedback.light()}
            >
              <Phone className="h-4 w-4" />
              Appeler
            </motion.a>
          </Button>
        </div>
      </div>
    </div>
  );
};

