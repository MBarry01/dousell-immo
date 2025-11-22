"use client";

import { useCallback } from "react";
import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import type { Property } from "@/types/property";

type ContactBarProps = {
  property: Property;
};

export const ContactBar = ({ property }: ContactBarProps) => {
  const handleWhatsApp = useCallback(() => {
    hapticFeedback.medium();
    analyticsEvents.contactWhatsApp(property.id, property.title);
  }, [property.id, property.title]);

  const handleCall = useCallback(() => {
    hapticFeedback.medium();
    analyticsEvents.contactCall(property.id, property.title);
  }, [property.id, property.title]);

  // Priorité : agent.whatsapp > agent.phone > owner.phone > AGENCY_PHONE
  const whatsappNumber = property.agent.whatsapp || property.agent.phone || property.owner?.phone || AGENCY_PHONE;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien ${property.title} (${property.id}) à ${property.location.city}.`
  )}`;

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
                  <a href={`tel:${property.agent.phone || property.owner?.phone || AGENCY_PHONE}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Appeler
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{property.agent.phone || property.owner?.phone || AGENCY_PHONE_DISPLAY}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

