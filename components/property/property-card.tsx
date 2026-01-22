"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Bookmark, Bed, Bath, Square, MapPin } from "lucide-react";

import { toast } from "sonner";

import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ListingImageCarousel } from "@/components/property/listing-image-carousel";
import { cn, formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { useFavoritesStore } from "@/store/use-store";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
  className?: string;
  variant?: "vertical" | "horizontal";
};

export const PropertyCard = ({
  property,
  className,
  variant = "vertical",
}: PropertyCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const favorite = isFavorite(property.id);

  const toggleFavorite = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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
  const href = isExternal ? (property.source_url || '#') : `/biens/${property.id}`;
  const CardWrapper = isExternal ? 'a' : Link;
  const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  if (variant === "horizontal") {
    return (
      <CardWrapper
        href={href}
        {...linkProps}
        className={cn(
          "group relative flex min-w-[280px] items-center gap-4 rounded-[24px] border border-white/10 bg-background p-3 text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.99] isolate",
          className
        )}
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-2xl z-20" data-carousel style={{ pointerEvents: 'auto' }}>
          {/* Prevent link click when clicking carousel */}
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full">
            <ListingImageCarousel
              images={property.images}
              alt={property.title}
              className="h-full w-full"
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
        "group relative flex w-72 flex-none flex-col overflow-hidden rounded-[28px] bg-background border border-white/10 p-3 text-white transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 active:scale-[0.99] isolate cursor-pointer",
        // Desktop: dans une grille, la largeur est gérée par la grille CSS automatiquement
        className
      )}
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
        <button
          type="button"
          aria-label="Enregistrer"
          onClick={toggleFavorite}
          className={`absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/80 ${favorite ? "text-amber-300" : ""
            }`}
          style={{ pointerEvents: 'auto' }}
        >
          <Bookmark className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
        </button>
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
          {property.specs.dpe && (
            <span className="rounded-full border border-white/10 bg-background px-3 py-1">
              DPE {property.specs.dpe}
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

