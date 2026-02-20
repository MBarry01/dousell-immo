"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { trackPropertyAction } from "@/app/(vitrine)/api/property-stats/actions";
import { useAuth } from "@/hooks/use-auth";
import { sendGTMEvent } from "@/lib/gtm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CostSimulator } from "@/components/property/cost-simulator";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";
import { AGENCY_PHONE } from "@/lib/constants";

type BookingCardProps = {
  property: Property;
};

export const BookingCard = ({ property }: BookingCardProps) => {
  const router = useRouter();
  const { user } = useAuth();

  // Résolution du numéro de contact : équipe > contact_phone > owner > agent > fallback
  const targetPhone = property.team?.company_phone
    || property.contact_phone
    || property.owner?.phone
    || property.agent?.phone
    || AGENCY_PHONE;

  const whatsappUrl = `https://wa.me/${targetPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien ${property.title} (${property.id}) à ${property.location.city}.`
  )}`;

  const handleWhatsAppClick = useCallback(async () => {
    // GTM Tracking
    sendGTMEvent("contact_click", {
      method: "whatsapp",
      value: "desktop_sidebar",
      property_id: property.id
    });

    await trackPropertyAction({
      propertyId: property.id,
      actionType: "whatsapp_click",
      userId: user?.id || null,
    });
  }, [property.id, user?.id]);

  /**
   * Gère le clic sur le bouton "Demander une visite"
   * Redirige vers la page de planification avec les informations du bien pré-remplies
   */
  const handleRequestVisit = () => {
    // Construire le message pré-rempli avec les informations du bien
    const propertyInfo = `Je suis intéressé(e) par le bien "${property.title}" (${formatCurrency(property.price)}) situé à ${property.location.address || property.location.city}${property.location.landmark ? `, ${property.location.landmark}` : ""}.`;

    // Rediriger vers la page de planification avec les paramètres
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-24 hidden lg:block"
    >
      <div className="rounded-3xl border border-gray-200 bg-white/70 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f18]/80">
        {/* Prix */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(property.price)}
            </span>
            {property.transaction === "location" && (
              <span className="text-lg text-gray-600 dark:text-white/60">
                / mois
              </span>
            )}
          </div>
        </div>

        {/* Simulateur (Accordéon) */}
        {property.transaction === "location" && (
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="simulator" className="border-none">
              <AccordionTrigger className="py-3 text-sm font-medium text-gray-700 hover:no-underline dark:text-white/80">
                Simuler les frais d&apos;entrée
              </AccordionTrigger>
              <AccordionContent>
                <CostSimulator
                  price={property.price}
                  type={property.transaction}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* CTA Principal */}
        <div className="space-y-3">
          <Button
            asChild
            className="w-full rounded-2xl bg-[#25D366] py-7 text-base font-bold text-white shadow-[0_8px_20px_-4px_rgba(37,211,102,0.4)] transition-all hover:bg-[#25D366] hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(37,211,102,0.5)] active:scale-95"
            onClick={handleWhatsAppClick}
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Réserver / Visiter
            </a>
          </Button>

          {/* CTA Secondaire */}
          <Button
            onClick={handleRequestVisit}
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-7 text-base font-bold text-white transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-md active:scale-95"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Demander une visite
          </Button>

          {/* Micro-copy */}
          <p className="text-center text-xs text-gray-500 dark:text-white/50">
            Aucun frais avant la visite.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

