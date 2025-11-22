"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Bed, Bath, Square, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ListingImageCarousel } from "@/components/property/listing-image-carousel";
import { cn, formatCurrency } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptic";
import { useFavoritesStore } from "@/store/use-store";
import type { Property } from "@/types/property";
import Link from "next/link";

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
  const router = useRouter();
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

  const handleCardClick = (event: MouseEvent) => {
    // Ne pas naviguer si le clic vient du carousel ou d'un bouton
    const target = event.target as HTMLElement;
    if (
      target.closest('[data-carousel]') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      return;
    }
    router.push(`/biens/${property.id}`);
  };

  if (variant === "horizontal") {
    return (
      <motion.article
        layout
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
        className={cn(
          "group relative flex min-w-[280px] items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-3 text-white transition-shadow hover:shadow-lg hover:shadow-black/20",
          className
        )}
      >
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleCardClick}
          aria-label={`Voir ${property.title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/biens/${property.id}`);
          }
        }}
        />
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl z-20" data-carousel style={{ pointerEvents: 'auto' }}>
          <ListingImageCarousel
            images={property.images}
            alt={property.title}
            className="h-full w-full"
          />
          <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold">
            {formatCurrency(property.price)}
          </div>
        </div>
        <div className="relative z-20 flex flex-1 flex-col gap-1">
          <p className="flex items-center gap-1 text-[11px] text-white/60">
            <MapPin className="h-3 w-3" />
            {property.location.city}
          </p>
          <h3 className="truncate text-sm font-semibold">{property.title}</h3>
          <p className="text-[11px] text-white/50">{property.location.landmark}</p>
          <div className="flex items-center gap-3 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.specs.bedrooms} ch
            </span>
            <span className="inline-flex items-center gap-1">
              <Square className="h-3.5 w-3.5" />
              {property.specs.surface} m²
            </span>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={cn(
        // Mobile: largeur fixe pour scroll horizontal
        "group relative flex w-72 flex-none flex-col overflow-hidden rounded-[28px] bg-white/5 p-3 text-white transition-shadow hover:shadow-xl hover:shadow-black/30",
        // Desktop: dans une grille, la largeur est gérée par la grille CSS automatiquement
        className
      )}
    >
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleCardClick}
        aria-label={`Voir ${property.title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/biens/${property.id}`);
          }
        }}
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] z-20" data-carousel style={{ pointerEvents: 'auto' }}>
        <ListingImageCarousel
          images={property.images}
          alt={property.title}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">
            {property.location.city}
          </span>
        </div>
        <button
          type="button"
          aria-label="Enregistrer"
          onClick={toggleFavorite}
          className={`absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/80 ${
            favorite ? "text-amber-300" : ""
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          <Bookmark className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
        </button>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-1 text-xs font-semibold text-gray-900">
          {formatCurrency(property.price)}
        </div>
      </div>
      <div className="relative z-20 space-y-3 px-1 pb-1 pt-4">
        <div>
          <p className="flex items-center gap-1 text-xs text-white/60">
            <MapPin className="h-3.5 w-3.5" />
            {property.location.city}
          </p>
          <h3 className="truncate text-lg font-semibold tracking-tight">
            {property.title}
          </h3>
          <p className="text-xs text-white/50">{property.location.landmark}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/70">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.specs.rooms} pièces
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.specs.bathrooms} sdb
          </span>
          <span className="inline-flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.specs.surface} m²
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {property.details.type}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            DPE {property.specs.dpe}
          </span>
        </div>
        <div className="pt-2">
          <Button
            variant="secondary"
            className="w-full justify-between rounded-2xl bg-white text-black transition hover:-translate-y-0.5 hover:shadow-lg"
            asChild
          >
            <Link href={`/biens/${property.id}`}>
              Découvrir
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
};

