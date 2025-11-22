"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  BatteryCharging,
  Droplets,
  Shield,
  Wifi,
  Wind,
  Car,
  MapPin,
  Star,
  Clock,
  Home,
  Bed,
  Bath,
  LayoutGrid,
  MessageCircle,
  Phone,
} from "lucide-react";
import Image from "next/image";

import { GalleryGrid } from "@/components/property/gallery-grid";
import { BookingCard } from "@/components/property/booking-card";
import { ShareButton } from "@/components/property/share-button";
import { ContactBar } from "@/components/property/contact-bar";
import { StaticMap } from "@/components/property/static-map";
import { SimilarProperties } from "@/components/property/similar-properties";
import { ReviewForm } from "@/components/property/review-form";
import { ReviewItem } from "@/components/property/review-item";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { analyticsEvents } from "@/lib/analytics";
import { AGENCY_PHONE, AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { useFavoritesStore } from "@/store/use-store";
import { formatCurrency } from "@/lib/utils";
import type { Property } from "@/types/property";
import type { Review, ReviewStats } from "@/services/reviewService";

type PropertyDetailViewProps = {
  property: Property;
  similar: Property[];
  shareUrl: string;
  reviews?: Review[];
  reviewStats?: ReviewStats;
};

export const PropertyDetailView = ({
  property,
  similar,
  shareUrl,
  reviews = [],
  reviewStats,
}: PropertyDetailViewProps) => {
  const router = useRouter();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const favorite = isFavorite(property.id);

  const toggleFavorite = () => {
    if (favorite) {
      removeFavorite(property.id);
      toast.success("Retiré des favoris", { description: property.title });
    } else {
      addFavorite(property);
      toast.success("Ajouté aux favoris ✨", { description: property.title });
    }
  };

  const highlights = [
    {
      icon: BatteryCharging,
      title: "Groupe Électrogène",
      subtitle: "Couverture totale",
      active: property.details.hasBackupGenerator,
    },
    {
      icon: Droplets,
      title: "Réservoir d'eau",
      subtitle: "Surpresseur inclus",
      active: property.details.hasWaterTank,
    },
    {
      icon: Shield,
      title: "Sécurité 24/7",
      subtitle: "Gardiennage",
      active: property.details.security,
    },
  ].filter((h) => h.active);

  const amenities = [
    { icon: Wifi, label: "Wi-Fi", active: true },
    { icon: Wind, label: "Climatisation", active: true },
    { icon: Car, label: "Parking", active: !!property.details.parking },
    {
      icon: BatteryCharging,
      label: "Groupe électrogène",
      active: property.details.hasBackupGenerator,
    },
    {
      icon: Droplets,
      label: "Réservoir d'eau",
      active: property.details.hasWaterTank,
    },
    { icon: Shield, label: "Sécurité", active: property.details.security },
  ].filter((a) => a.active);

  return (
    <div className="min-h-screen bg-white pb-32 text-gray-900 dark:bg-[#05080c] dark:text-white md:pb-40">
      {/* Mobile: Gallery avec overlay */}
      <div className="relative md:hidden">
        <GalleryGrid
          propertyId={property.id}
          title={property.title}
          images={property.images}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            className="pointer-events-auto h-12 w-12 rounded-full bg-black/50 text-white backdrop-blur-md"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <motion.button
              onClick={toggleFavorite}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
              animate={{ scale: favorite ? [1, 1.2, 1] : 1 }}
            >
              <Heart className={`h-5 w-5 ${favorite ? "fill-white" : ""}`} />
            </motion.button>
            <ShareButton
              property={property}
              shareUrl={shareUrl}
              variant="icon"
              className="h-12 w-12 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
            />
          </div>
        </div>
      </div>

      {/* Desktop: Gallery sans overlay */}
      <div className="hidden md:block">
        <div className="relative">
          <GalleryGrid
            propertyId={property.id}
            title={property.title}
            images={property.images}
          />
          <div className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/90 text-gray-900 backdrop-blur-md hover:bg-white"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <motion.button
                onClick={toggleFavorite}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 backdrop-blur-md hover:bg-white"
                animate={{ scale: favorite ? [1, 1.2, 1] : 1 }}
              >
                <Heart
                  className={`h-5 w-5 ${favorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </motion.button>
              <ShareButton
                property={property}
                shareUrl={shareUrl}
                variant="icon"
                className="h-12 w-12 rounded-full bg-white/90 text-gray-900 backdrop-blur-md hover:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-6 lg:grid lg:grid-cols-3 lg:gap-12">
        {/* Colonne Gauche (Infos - span-2) */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-amber-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
                {property.details.type}
              </span>
              {property.status && (
                <span className="rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  {property.status}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white md:text-4xl">
              {property.title}
            </h1>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.location.address || property.location.city}
                  {property.location.landmark && `, ${property.location.landmark}`}
                </span>
              </div>
              {property.location.address && (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {property.location.city}
                </p>
              )}
            </div>
          </div>

          {/* Spécifications principales */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                <Home className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.specs.surface}m²
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">Surface</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.specs.rooms}
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">Pièces</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                <Bed className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.specs.bedrooms}
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">Chambres</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 dark:bg-white/10 dark:text-white">
                <Bath className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.specs.bathrooms}
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60">Salles d'eau</p>
            </div>
          </div>

          {/* Infos Agent (Hôte) */}
          <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-6 dark:border-white/10">
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              {property.agent.photo ? (
                <Image
                  src={property.agent.photo}
                  alt={property.agent.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xl font-bold text-gray-600 dark:bg-white/20 dark:text-white/80">
                  {property.agent.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-white/60">
                Proposé par
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {property.agent.name}
              </p>
              {property.agent.phone && (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {property.agent.phone}
                </p>
              )}
            </div>
          </div>

          {/* Highlights (Dakar Specs) */}
          {highlights.length > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
                      <Icon className="h-6 w-6 text-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {highlight.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        {highlight.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              À propos de ce logement
            </h2>
            <p className="text-gray-700 dark:text-white/80 leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Détails techniques */}
          {(property.details.year || property.details.heating || property.details.charges || property.details.parking) && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Détails techniques
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                {property.details.year && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                      Année de construction
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {property.details.year}
                    </dd>
                  </div>
                )}
                {property.details.heating && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                      Chauffage / Climatisation
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {property.details.heating}
                    </dd>
                  </div>
                )}
                {property.details.charges && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                      Charges mensuelles
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(property.details.charges)}
                    </dd>
                  </div>
                )}
                {property.details.taxeFonciere && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                      Taxe foncière annuelle
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(property.details.taxeFonciere)}
                    </dd>
                  </div>
                )}
                {property.details.parking && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                      Parking
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {property.details.parking}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/50">
                    Performance énergétique
                  </dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      property.specs.dpe === "A" ? "bg-green-500/20 text-green-500" :
                      property.specs.dpe === "B" ? "bg-blue-500/20 text-blue-500" :
                      property.specs.dpe === "C" ? "bg-yellow-500/20 text-yellow-500" :
                      property.specs.dpe === "D" ? "bg-orange-500/20 text-orange-500" :
                      "bg-red-500/20 text-red-500"
                    }`}>
                      DPE {property.specs.dpe}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Équipements */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Ce que propose ce logement
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {amenities.map((amenity, index) => {
                const Icon = amenity.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-white/60" />
                    <span className="text-sm text-gray-700 dark:text-white/80">
                      {amenity.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disponibilité */}
          <div className="mb-8">
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Disponibilité
            </h2>
            <p className="text-gray-700 dark:text-white/80">
              {property.disponibilite || "Disponible immédiatement"}
            </p>
          </div>

          {/* Proximités */}
          {property.proximites && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                À proximité
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {property.proximites.transports && property.proximites.transports.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Transports
                    </h3>
                    <ul className="space-y-1">
                      {property.proximites.transports.map((transport, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-white/70">
                          • {transport}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {property.proximites.ecoles && property.proximites.ecoles.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Écoles
                    </h3>
                    <ul className="space-y-1">
                      {property.proximites.ecoles.map((ecole, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-white/70">
                          • {ecole}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {property.proximites.commerces && property.proximites.commerces.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Commerces
                    </h3>
                    <ul className="space-y-1">
                      {property.proximites.commerces.map((commerce, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-white/70">
                          • {commerce}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite (Booking Card - span-1) */}
        <div className="lg:col-span-1">
          <BookingCard property={property} />
        </div>
      </div>

      {/* Bas de Page (Full Width) */}
      <div className="mx-auto mt-16 max-w-7xl px-4 md:px-6">
        {/* Reviews */}
        <div className="mb-12 border-t border-gray-200 pt-12 dark:border-white/10">
          <div className="mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {reviewStats && reviewStats.total_reviews > 0
                ? reviewStats.average_rating.toFixed(1)
                : "0.0"}
            </span>
            <span className="text-gray-600 dark:text-white/60">
              ({reviewStats?.total_reviews || 0}{" "}
              {reviewStats?.total_reviews === 1 ? "avis" : "avis"})
            </span>
          </div>

          {/* Formulaire pour ajouter un avis */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Laisser un avis
            </h3>
            <ReviewForm propertyId={property.id} />
          </div>

          {/* Liste des avis */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} propertyId={property.id} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-white/50">
              Aucun avis pour le moment. Soyez le premier à laisser un avis !
            </p>
          )}
        </div>

        {/* Map */}
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Où se situe le logement
          </h2>
          <StaticMap
            coords={property.location.coords}
            city={property.location.city}
            address={property.location.address}
            landmark={property.location.landmark}
          />
        </div>

        {/* Agent Profile */}
        <div className="mb-12 border-t border-gray-200 pt-12 dark:border-white/10">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            Faites connaissance avec Agence Dousell
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full">
              <Image
                src="/agent2.jpg"
                alt="Amadou Barry"
                fill
                className="object-cover object-[center_top]"
                sizes="128px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Amadou Barry
                </h3>
                <p className="mb-2 text-gray-700 dark:text-white/80">
                  Co-fondateur et expert terrain, spécialisé dans les visites, l&apos;accompagnement sur le terrain et la connaissance approfondie du marché dakarois. Votre contact privilégié pour toutes vos démarches immobilières.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
                  <Clock className="h-4 w-4" />
                  <span>Répond dans l&apos;heure</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto rounded-2xl border-gray-200 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        data-property-id={property.id}
                        data-property-title={property.title}
                        data-category="contact"
                        data-label="Phone"
                        onClick={() => {
                          analyticsEvents.contactCall(property.id, property.title);
                        }}
                      >
                        <a
                          href={`tel:${property.owner?.phone || AGENCY_PHONE}`}
                          className="flex items-center justify-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Appeler
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{property.owner?.phone || AGENCY_PHONE_DISPLAY}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  asChild
                  className="w-full sm:w-auto rounded-2xl bg-[#25D366] text-sm font-semibold text-white hover:bg-[#20BD5A] dark:bg-[#25D366] dark:hover:bg-[#20BD5A]"
                  data-property-id={property.id}
                  data-property-title={property.title}
                  data-category="contact"
                  data-label="WhatsApp"
                  onClick={() => {
                    analyticsEvents.contactWhatsApp(property.id, property.title);
                  }}
                >
                  <a
                    href={`https://wa.me/${(property.owner?.phone || AGENCY_PHONE).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        <SimilarProperties properties={similar} />
      </div>

      {/* Contact Bar Mobile */}
      <ContactBar property={property} />
    </div>
  );
};
