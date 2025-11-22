"use client";

import { useState } from "react";
import { MessageCircle, Phone, Calendar } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CostSimulator } from "@/components/property/cost-simulator";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";

type BookingCardProps = {
  property: Property;
};

export const BookingCard = ({ property }: BookingCardProps) => {
  // Priorité : agent.whatsapp > agent.phone > owner.phone > AGENCY_PHONE
  const whatsappNumber = property.agent.whatsapp || property.agent.phone || property.owner?.phone || AGENCY_PHONE;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien ${property.title} (${property.id}) à ${property.location.city}.`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-24 hidden lg:block"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/5">
        {/* Prix */}
        <div className="mb-6">
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
            className="w-full rounded-xl bg-[#25D366] py-6 text-base font-semibold text-white hover:bg-[#20ba58]"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Réserver / Visiter
            </a>
          </Button>

          {/* CTA Secondaire */}
          <Button
            variant="outline"
            className="w-full rounded-xl border-2 border-gray-300 py-6 text-base font-semibold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
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

