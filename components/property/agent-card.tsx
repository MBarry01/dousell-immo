"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, Clock, Phone, User, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import type { Property } from "@/types/property";

type AgentCardProps = {
  agent: Property["agent"];
  owner?: Property["owner"];
  property?: Property;
  propertyId?: string;
  propertyTitle?: string;
};

// Informations de l'agent Mohamadou Barry (agent1) - Côté technique
const _AGENT1_INFO = {
  name: "Mohamadou Barry",
  photo: "/agent1.png",
  description: "Co-fondateur spécialisé dans l'aspect technique et technologique de l'immobilier. Expert en plateformes digitales et solutions innovantes pour faciliter vos transactions.",
  whatsappNumber: "+330751081579",
  phoneNumber: "+330751081579",
  responseTime: "Répond dans l'heure",
};

// Informations de l'agent Amadou Barry (agent2) - Côté terrain
const AGENT2_INFO = {
  name: "Amadou Barry",
  photo: "/agent2.png",
  description: "Co-fondateur et expert terrain, spécialisé dans les visites, l'accompagnement sur le terrain et la connaissance approfondie du marché dakarois. Votre contact privilégié pour toutes vos démarches immobilières.",
  whatsappNumber: "+221781385281",
  phoneNumber: "+221781385281",
  responseTime: "Répond dans l'heure",
};

// Utiliser agent2 par défaut (public)
const AGENT_INFO = AGENT2_INFO;

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const AgentCard = ({ agent, owner, property, propertyId, propertyTitle }: AgentCardProps) => {
  // Si un propriétaire existe, afficher ses informations
  const isOwner = !!owner && (owner.full_name || owner.phone);

  // Informations à afficher
  const displayName = isOwner
    ? (owner.full_name || "Propriétaire")
    : (agent?.name || AGENT_INFO.name);

  const displayPhoto = isOwner && owner.avatar_url
    ? owner.avatar_url
    : (agent?.photo || AGENT_INFO.photo);

  const displayDescription = isOwner
    ? owner.role === "agent"
      ? "Agent immobilier professionnel"
      : "Propriétaire particulier"
    : AGENT_INFO.description;

  // Numéro de téléphone : propriétaire, agent par défaut, ou agence (fallback)
  const phoneNumber = owner?.phone || property?.owner?.phone || AGENT_INFO.phoneNumber || AGENCY_PHONE;
  const phoneNumberDisplay = owner?.phone || property?.owner?.phone || AGENT_INFO.phoneNumber || AGENCY_PHONE_DISPLAY;
  const phoneLink = `tel:${phoneNumber}`;

  // WhatsApp : utiliser le numéro du propriétaire ou de l'agent
  const whatsappNumber = owner?.phone || property?.owner?.phone || AGENT_INFO.whatsappNumber;
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;

  // Date de création du profil
  const memberSince = owner?.updated_at
    ? format(new Date(owner.updated_at), "MMMM yyyy", { locale: fr })
    : null;

  // Handler pour le tracking des appels
  const handlePhoneClick = () => {
    if (propertyId && propertyTitle) {
      analyticsEvents.contactCall(propertyId, propertyTitle);
    }
  };

  // Handler pour le tracking WhatsApp
  const handleWhatsAppClick = () => {
    if (propertyId && propertyTitle) {
      analyticsEvents.contactWhatsApp(propertyId, propertyTitle);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          {displayPhoto ? (
            <Image
              src={displayPhoto}
              alt={displayName}
              fill
              className="object-cover object-[center_top]"
              quality={85}
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-600 dark:text-white/70">
              {getInitials(displayName)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {displayName}
              </h3>
              {owner?.is_identity_verified && (
                <BadgeCheck className="h-5 w-5 text-amber-400" />
              )}
            </div>
            {owner && (
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={owner.role === "agent" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {owner.role === "agent" ? "Agent Pro" : "Particulier"}
                </Badge>
              </div>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/70">
              {displayDescription}
            </p>
          </div>
          {memberSince && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
              <Clock className="h-3.5 w-3.5" />
              <span>Membre depuis {memberSince}</span>
            </div>
          )}
          {!memberSince && !isOwner && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
              <Clock className="h-3.5 w-3.5" />
              <span>{AGENT_INFO.responseTime}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                className="flex-1 rounded-2xl border-gray-200 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                onClick={handlePhoneClick}
                data-property-id={propertyId}
                data-property-title={propertyTitle}
                data-category="contact"
                data-label="Phone"
              >
                <a
                  href={phoneLink}
                  className="flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Appeler
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{phoneNumberDisplay}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          asChild
          className="flex-1 rounded-2xl bg-[#25D366] text-sm font-semibold text-white hover:bg-[#20BD5A] dark:bg-[#25D366] dark:hover:bg-[#20BD5A]"
          onClick={handleWhatsAppClick}
          data-property-id={propertyId}
          data-property-title={propertyTitle}
          data-category="contact"
          data-label="WhatsApp"
        >
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

