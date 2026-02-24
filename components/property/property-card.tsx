"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Bookmark, Bed, Bath, Square, MapPin, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "sonner";

import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ListingImageCarousel } from "@/components/property/listing-image-carousel";
import { cn, formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFavoritesStore } from "@/store/use-store";
import { useMounted } from "@/hooks/use-mounted";
import { useRouter } from "next/navigation";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
  className?: string;
  variant?: "vertical" | "horizontal";
  priority?: boolean;
};

export const PropertyCard = ({
  property,
  className,
  variant = "vertical",
  priority = false,
}: PropertyCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const mounted = useMounted();
  const { user } = useAuth();
  const router = useRouter();
  const favorite = mounted && user ? isFavorite(property.id) : false;

  const toggleFavorite = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

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

    hapticFeedback.light();
    if (favorite) {
      removeFavorite(property.id);
      toast.success("Retiré des favoris", { description: property.title });
    } else {
      addFavorite(property);
      hapticFeedback.success();
      toast.success("Ajouté aux favoris ✨", { description: property.title });
    }
  };

  const isExternal = property.isExternal;
  const href = isExternal ? `/biens/ext/${property.id}` : `/biens/${property.id}`;
  const CardWrapper = motion(Link);
  const linkProps = {};

  if (variant === "horizontal") {
    return (
      <CardWrapper
        href={href}
        {...linkProps}
        className={cn(
          "group relative flex min-w-[280px] items-center gap-4 rounded-[24px] border border-white/10 bg-background/50 p-3 text-white transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 isolate",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-2xl z-20" data-carousel style={{ pointerEvents: 'auto' }}>
          {/* Prevent link click when clicking carousel */}
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full">
            <ListingImageCarousel
              images={property.images}
              alt={property.title}
              className="h-full w-full"
              priority={priority}
            />
          </div>
          <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold">
            {formatCurrency(property.price)}
          </div>
        </div>
        <div className="relative z-20 flex flex-1 min-w-0 flex-col gap-1">
          <p className="flex items-center gap-1 text-[11px] text-white/60 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.location.city}</span>
          </p>
          <h3 className="truncate text-sm font-semibold flex items-center gap-2" title={property.title}>
            {property.title}
            {property.verification_status === "verified" && (
              <VerifiedBadge variant="icon" size="sm" showTooltip={false} />
            )}
          </h3>
          <p className="truncate text-[11px] text-white/50" title={property.location.landmark}>
            {property.location.landmark}
          </p>
          {(property.specs.bedrooms > 0 || property.specs.surface > 0) && (
            <div className="flex items-center gap-3 text-[11px] text-white/70">
              {property.specs.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  {property.specs.bedrooms} ch
                </span>
              )}
              {property.specs.surface > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Square className="h-3.5 w-3.5" />
                  {property.specs.surface} m²
                </span>
              )}
            </div>
          )}
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      href={href}
      {...linkProps}
      className={cn(
        // Mobile: largeur fixe pour scroll horizontal
        "group relative flex w-72 flex-none flex-col overflow-hidden rounded-[28px] bg-background border border-white/10 p-3 text-white transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 isolate cursor-pointer",
        // Desktop: dans une grille, la largeur est gérée par la grille CSS automatiquement
        className
      )}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] z-10"
        data-carousel
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Empêcher la propagation du clic vers le div cliquable de la carte
          e.preventDefault(); // Added preventDefault just in case for link
          e.stopPropagation();
        }}
      >
        <ListingImageCarousel
          images={property.images}
          alt={property.title}
          className="h-full w-full"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {property.verification_status === "verified" && (
            <VerifiedBadge variant="pill" className="shadow-lg" />
          )}
          {property.featured && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black shadow-lg">
              Sponsorisé
            </span>
          )}
          {property.exclusive && (
            <span className="rounded-full bg-black border-2 border-primary px-3 py-1 text-xs font-semibold text-primary">
              Exclusivité
            </span>
          )}
          {property.isExternal && (
            <span className="rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20">
              Partenaire
            </span>
          )}
        </div>
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Enregistrer"
          onClick={toggleFavorite}
          whileTap={{ scale: 0.8 }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavorite(e as unknown as React.MouseEvent); } }}
          className={`absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/80 cursor-pointer no-select ${favorite ? "text-amber-300" : ""
            }`}
          style={{ pointerEvents: 'auto' }}
        >
          <Bookmark className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
        </motion.div>
        <div className="absolute bottom-4 left-4 rounded-full bg-black/80 backdrop-blur-sm px-4 py-2 border border-primary/30">
          <p className="text-sm font-bold text-primary">{formatCurrency(property.price)}</p>
        </div>
      </div>
      <div className="relative z-20 space-y-3 px-1 pb-1 pt-4 pointer-events-none">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {property.location.city}
          </p>
          <h3 className="line-clamp-2 text-lg font-bold tracking-tight leading-tight mb-1">
            {property.title}
          </h3>
          <p className="text-xs text-white/50 line-clamp-1">{property.location.landmark}</p>
        </div>
        {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.surface > 0) && (
          <div className="flex items-center gap-4 text-xs text-white/70">
            {property.specs.bedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-primary/80" />
                <span className="font-medium">{property.specs.bedrooms}</span>
              </span>
            )}
            {property.specs.bathrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-primary/80" />
                <span className="font-medium">{property.specs.bathrooms}</span>
              </span>
            )}
            {property.specs.surface > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Square className="h-4 w-4 text-primary/80" />
                <span className="font-medium">{property.specs.surface}m²</span>
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
          <span className="rounded-full border border-white/10 bg-background px-3 py-1">
            {property.details.type}
          </span>
          {property.is_colocation && (
            <span className="rounded-full border border-primary/30 bg-primary/10 text-primary-foreground px-3 py-1 font-medium">
              Colocation {property.occupied_rooms !== undefined && property.occupied_rooms > 0 && `(${property.occupied_rooms}/${property.specs.bedrooms} occupés)`}
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

