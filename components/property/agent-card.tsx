"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, Clock, Phone, BadgeCheck, ExternalLink, Settings2, Users, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import type { Property } from "@/types/property";

type AgentCardProps = {
  agent: Property["agent"];
  owner?: Property["owner"];
  property?: Property;
  propertyId?: string;
  propertyTitle?: string;
};

const getInitials = (name: string): string =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const AgentCard = ({ agent, owner, property, propertyId, propertyTitle }: AgentCardProps) => {
  const { user } = useAuth();

  // --- Résolution du publieur ---
  // Cas 1 : Bien géré par une équipe (via Gestion > Équipe)
  const team = property?.team;
  const hasTeam = !!team?.name;

  // Cas 2 : Propriétaire individuel (via Gestion ou formulaire Vitrine)
  // hasOwner = vrai dès qu'on a un objet owner (même sans nom, si on a le numéro)
  const hasOwner = !!owner && !!(owner.full_name || owner.phone);
  const isAgentRole = hasOwner && owner?.role === "agent";

  const hasPublisher = hasTeam || hasOwner;

  // Identité affichée
  const displayName = hasTeam
    ? team.name!
    : hasOwner
      ? (owner!.full_name || (isAgentRole ? "Agent" : "Propriétaire"))
      : (agent?.name || "Propriétaire");

  const displayPhoto = hasTeam && team?.logo_url
    ? team.logo_url
    : hasOwner && owner?.avatar_url
      ? owner.avatar_url
      : (agent?.photo || "");

  const displayDescription = hasTeam
    ? "Agence immobilière enregistrée sur Dousell Immo"
    : isAgentRole
      ? "Agent immobilier professionnel — accompagnement personnalisé"
      : hasOwner
        ? "Propriétaire particulier — contact direct, sans intermédiaire"
        : "Contactez-nous pour plus d’informations sur ce bien";

  // Contacts prioritaires : équipe > propriétaire > agent statique > agence fallback
  const phoneNumber = team?.company_phone
    || owner?.phone
    || property?.owner?.phone
    || agent?.phone
    || AGENCY_PHONE;

  const phoneNumberDisplay = team?.company_phone
    || owner?.phone
    || property?.owner?.phone
    || agent?.phone
    || AGENCY_PHONE_DISPLAY;

  const phoneLink = `tel:${phoneNumber}`;

  const whatsappNumber = (team?.company_phone || owner?.phone || property?.owner?.phone || agent?.whatsapp || agent?.phone || AGENCY_PHONE)
    .replace(/[^0-9]/g, "");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par le bien "${propertyTitle || ""}".`
  )}`;

  // Lien "Voir ses annonces" → /recherche?owner={id}
  // Pour une équipe, on filtrera par team_id plus tard — pour l'instant on filtre via l'owner_id du créateur
  const ownerListingsUrl = owner?.id ? `/recherche?owner=${owner.id}` : null;

  // Lien "Gérer ce bien" — uniquement pour l'owner connecté
  const isCurrentUserOwner = !!user && !!owner?.id && user.id === owner.id;
  const manageUrl = isCurrentUserOwner && propertyId ? `/gestion/biens/${propertyId}` : null;

  // Ancienneté du compte publieur
  const memberSince = owner?.updated_at
    ? format(new Date(owner.updated_at), "MMMM yyyy", { locale: fr })
    : null;

  const handlePhoneClick = () => {
    if (propertyId && propertyTitle) analyticsEvents.contactCall(propertyId, propertyTitle);
  };

  const handleWhatsAppClick = () => {
    if (propertyId && propertyTitle) analyticsEvents.contactWhatsApp(propertyId, propertyTitle);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 rounded-[32px] border border-gray-100 bg-white/40 p-8 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-white/5"
    >
      {/* Header — Photo + Identité */}
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 shadow-inner dark:bg-white/10 ring-4 ring-white dark:ring-white/5">
          {displayPhoto ? (
            <Image
              src={displayPhoto}
              alt={displayName}
              fill
              className="object-cover object-[center_top] transition-transform duration-500 hover:scale-110"
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
          {/* Label "Proposé par" */}
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/40">
            Proposé par
          </p>

          {/* Nom + Vérification */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
              {displayName}
            </h3>
            {owner?.is_identity_verified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeCheck className="h-5 w-5 shrink-0 text-amber-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent><p>Identité vérifiée</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Badge de rôle */}
          <div className="flex flex-wrap items-center gap-2">
            {hasTeam && (
              <Badge className="gap-1 bg-primary/15 text-xs text-primary hover:bg-primary/15">
                <Users className="h-3 w-3" />
                Agence
              </Badge>
            )}
            {!hasTeam && isAgentRole && (
              <Badge className="gap-1 bg-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/20">
                <User className="h-3 w-3" />
                Agent Pro
              </Badge>
            )}
            {!hasTeam && hasOwner && !isAgentRole && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <User className="h-3 w-3" />
                Particulier
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-600 dark:text-white/70">
            {displayDescription}
          </p>

          {/* Ancienneté */}
          {memberSince ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
              <Clock className="h-3.5 w-3.5" />
              <span>Membre depuis {memberSince}</span>
            </div>
          ) : !hasPublisher && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
              <Clock className="h-3.5 w-3.5" />
              <span>Répond dans l&apos;heure</span>
            </div>
          )}

          {/* Liens Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {ownerListingsUrl && (
              <Link
                href={ownerListingsUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/70"
              >
                <ExternalLink className="h-3 w-3" />
                Voir ses annonces
              </Link>
            )}
            {manageUrl && (
              <Link
                href={manageUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Gérer ce bien
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CTA Contacts */}
      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className="flex-1 rounded-2xl border border-white/20 bg-white/10 py-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-md active:scale-95 no-select"
                onClick={handlePhoneClick}
                data-property-id={propertyId}
                data-property-title={propertyTitle}
                data-category="contact"
                data-label="Phone"
              >
                <a href={phoneLink} className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  Appeler
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{phoneNumberDisplay}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          asChild
          className="flex-1 rounded-2xl bg-[#25D366] py-6 text-sm font-bold text-white shadow-[0_8px_20px_-4px_rgba(37,211,102,0.3)] transition-all hover:bg-[#25D366] hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(37,211,102,0.4)] active:scale-95 no-select dark:bg-[#25D366]"
          onClick={handleWhatsAppClick}
          data-property-id={propertyId}
          data-property-title={propertyTitle}
          data-category="contact"
          data-label="WhatsApp"
        >
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      </div>
    </motion.div>
  );
};
