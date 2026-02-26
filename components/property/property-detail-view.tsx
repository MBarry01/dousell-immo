"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  BatteryCharging,
  Droplets,
  Shield,
  BadgeCheck,
  Wifi,
  Wind,
  Car,
  MapPin,
  Star,
  Home,
  Bed,
  Bath,
  LayoutGrid,
  Lock,
} from "lucide-react";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import { hapticFeedback } from "@/lib/haptic";

import { GalleryGrid } from "@/components/property/gallery-grid";
import { BookingCard } from "@/components/property/booking-card";
import { ShareButton } from "@/components/property/share-button";
import { ContactBar } from "@/components/property/contact-bar";
import { StaticMap } from "@/components/property/static-map";
import { SimilarProperties } from "@/components/property/similar-properties";
import { ReviewForm } from "@/components/property/review-form";
import { ReviewItem } from "@/components/property/review-item";
import { AgentCard } from "@/components/property/agent-card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useFavoritesStore } from "@/store/use-store";
import { useMounted } from "@/hooks/use-mounted";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { AGENCY_PHONE_DISPLAY } from "@/lib/constants";
import { incrementView } from "@/services/propertyService";
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
  const mounted = useMounted();
  const favorite = mounted ? isFavorite(property.id) : false;

  // Tracker la vue de la page (compteur incrémental optimisé)
  useEffect(() => {
    console.log("[PropertyDetailView] Mounting component for property:", property.id, property.title);
    void incrementView(property.id).then(() => {
      console.log("[PropertyDetailView] View incremented for:", property.id);
    });
  }, [property.id, property.title]);

  const breadcrumbItems = useMemo(() => {
    const transaction = property.transaction || (property.price < 5000000 ? "location" : "vente");
    const categoryLabel = transaction === "location" ? "Louer" : "Acheter";
    const city = property.location.city || property.location.district || property.location.region || "Sénégal";

    return [
      { label: "Accueil", href: "/" },
      {
        label: categoryLabel,
        href: `/recherche?category=${encodeURIComponent(transaction)}`,
      },
      {
        label: city,
        href: `/recherche?city=${encodeURIComponent(city)}`,
      },
      { label: property.title },
    ];
  }, [property]);

  const { user } = useAuth();

  const toggleFavorite = () => {
    // AUTH GUARD: Require login to add favorites
    if (!user) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      const loginUrl = currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : "/login";

      toast.custom(
        (t) => (
          <div
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0c1117]/95 p-5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in-0 zoom-in-95"
            style={{ minWidth: "320px", maxWidth: "420px" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-5 w-5 text-white/70" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-white">
                Connexion requise
              </h3>
              <p className="text-sm text-white/60">
                Connectez-vous pour enregistrer vos favoris et accéder à toutes les fonctionnalités.
              </p>
              <button
                onClick={() => {
                  router.push(loginUrl);
                  toast.dismiss(t);
                }}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-primary/90 active:scale-95"
              >
                Se connecter
              </button>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="h-6 w-6 shrink-0 rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ),
        {
          duration: 6000,
          position: "top-center",
        }
      );
      return;
    }

    if (favorite) {
      removeFavorite(property.id);
      hapticFeedback.light();
      toast.success("Retiré des favoris", { description: property.title });
    } else {
      addFavorite(property);
      hapticFeedback.medium();
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
        <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-20 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            asChild
            className="pointer-events-auto h-12 w-12 rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-95 no-select"
            onClick={() => router.back()}
          >
            <motion.button whileTap={{ scale: 0.92 }}>
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          </Button>
          <div className="flex gap-2">
            <motion.button
              onClick={toggleFavorite}
              whileTap={{ scale: 0.9 }}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md no-select"
              animate={{ scale: favorite ? [1, 1.2, 1] : 1 }}
            >
              <Heart className={`h-5 w-5 ${favorite ? "fill-white" : ""}`} />
            </motion.button>
            <ShareButton
              property={property}
              shareUrl={shareUrl}
              variant="icon"
              className="h-12 w-12 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 active:scale-95 transition-transform no-select"
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
          <div className="mb-6 space-y-3">
            <Breadcrumbs items={breadcrumbItems} />
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
              {(() => {
                const parts = [
                  property.location.district,
                  property.location.city,
                  property.location.region
                ].filter(Boolean);
                const formattedLocation = parts.join(", ");

                // On n'affiche l'adresse spécifique en dessous QUE si elle apporte une info supplémentaire
                // c'est-à-dire si elle est différente de la ville/quartier affiché juste au-dessus
                const shouldShowAddress = property.location.address &&
                  property.location.address !== formattedLocation &&
                  !property.location.address.includes(property.location.city);

                return (
                  <>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                      <MapPin className="h-4 w-4" />
                      <span>{formattedLocation}</span>
                    </div>
                    {shouldShowAddress && (
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        {property.location.address}
                      </p>
                    )}
                  </>
                );
              })()}
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
              <p className="text-xs text-gray-600 dark:text-white/60">
                {property.specs.bathrooms > 1 ? "Salles d'eau" : "Salle d'eau"}
              </p>
            </div>
          </div>

          {/* Infos publieur (Hôte) */}
          <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-6 dark:border-white/10">
            {(() => {
              // Priorité : équipe > owner > contact_phone > fallback
              const hasTeam = !!property.team?.name;
              const hasOwner = !!property.owner && !!(property.owner.full_name || property.owner.phone);

              const resolvedPhone = property.team?.company_phone
                || property.owner?.phone
                || property.contact_phone
                || AGENCY_PHONE_DISPLAY;

              const displayName = property.team?.name
                || property.owner?.full_name
                || (property.contact_phone ? "Propriétaire" : "Propriétaire");

              const displayPhoto = (hasTeam && property.team?.logo_url)
                ? property.team.logo_url
                : (hasOwner && property.owner?.avatar_url)
                  ? property.owner.avatar_url
                  : null;

              return (
                <>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    {displayPhoto ? (
                      <CldImageSafe
                        src={displayPhoto}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-600 dark:text-white/70">
                        {(displayName).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Proposé par
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {displayName}
                      </p>
                      {property.owner?.is_identity_verified && (
                        <div className="flex items-center" title="Identité vérifiée">
                          <BadgeCheck className="h-4 w-4 text-white fill-blue-500" />
                        </div>
                      )}
                    </div>
                    {resolvedPhone && (
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        {resolvedPhone}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Highlights (Dakar Specs) */}
          {highlights.length > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
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
          <div className="mb-12 md:mb-20">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              À propos de ce logement
            </h2>
            <p className="text-lg text-gray-700 dark:text-white/80 leading-relaxed max-w-3xl">
              {property.description}
            </p>
          </div>

          {/* Visite Virtuelle 360° */}
          {property.virtual_tour_url && (
            <div className="mb-12 md:mb-20 scroll-mt-20" id="visite-virtuelle">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="text-2xl">👀</span> Visite Virtuelle
              </h2>

              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 shadow-sm bg-gray-100 dark:bg-white/5" style={{ paddingTop: '56.25%' /* Ratio 16:9 */ }}>
                <iframe
                  src={property.virtual_tour_url}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Visite Virtuelle du bien"
                />

                {/* Badge "360° VIEW" en surimpression */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                  360° VIEW
                </div>
              </div>
            </div>
          )}

          {/* Détails techniques */}
          {(property.details.year || property.details.heating || property.details.charges || property.details.parking) && (
            <div className="mb-12 md:mb-20 rounded-2xl border border-gray-200 bg-gray-50/50 p-8 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
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

        {/* Propriétaire / Agent Profile */}
        <div className="mb-12 border-t border-gray-200 pt-12 dark:border-white/10">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            {property.owner ? "Proposé par" : "Faites connaissance avec Agence Dousel"}
          </h2>
          <AgentCard
            agent={property.agent}
            owner={property.owner}
            property={property}
            propertyId={property.id}
            propertyTitle={property.title}
          />
        </div>

        {/* Similar Properties */}
        <SimilarProperties properties={similar} />
      </div>

      {/* Contact Bar Mobile */}
      <ContactBar property={property} />
    </div >
  );
};
