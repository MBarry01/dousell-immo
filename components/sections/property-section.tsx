"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";
import { StaggerContainer, FadeIn, staggerItem } from "@/components/ui/motion-wrapper";

type PropertySectionProps = {
  title: string;
  subtitle?: string;
  properties: Property[];
  href: string;
  badge?: string;
  limit?: number;
  showViewMore?: boolean;
};

export const PropertySection = ({
  title,
  subtitle,
  properties,
  href,
  badge,
  limit,
  showViewMore = true,
}: PropertySectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const displayedProperties = limit ? properties.slice(0, limit) : properties;
  const hasMore = limit && properties.length > limit;

  const checkScrollButtons = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;

    // Marge de sécurité de 10px pour éviter les problèmes de précision
    const threshold = 10;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Vérification initiale
    checkScrollButtons();

    // Event listeners
    container.addEventListener("scroll", checkScrollButtons, { passive: true });
    window.addEventListener("resize", checkScrollButtons);

    // Vérification après un court délai pour s'assurer que le layout est stable
    const timeoutId = setTimeout(checkScrollButtons, 100);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
      clearTimeout(timeoutId);
    };
  }, [checkScrollButtons, displayedProperties.length]);

  // Si pas de propriétés, ne rien afficher
  if (!properties.length) return null;

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;

    // Calculer la largeur d'une carte (280px mobile, 320px desktop) + gap (40px mobile, 48px desktop)
    // On utilise une valeur moyenne de 350px pour un scroll fluide
    const scrollAmount = 350;
    const scrollDirection = direction === "left" ? -scrollAmount : scrollAmount;

    containerRef.current.scrollBy({
      left: scrollDirection,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-8 md:space-y-10">
      {/* Header - Style Airbnb */}
      <FadeIn>
        <div className="flex items-center justify-between px-4 md:px-0">
          <Link
            href={href}
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
              {title}
            </h2>
            <ChevronRight className="h-5 w-5 text-white/70 transition-transform group-hover:translate-x-1" />
          </Link>
          {subtitle && (
            <p className="hidden text-sm text-white/60 md:block">{subtitle}</p>
          )}
        </div>
      </FadeIn>

      {/* Liste des Biens - Scroll Horizontal (Mobile & Desktop) */}
      <div className="relative group">
        {/* Bouton Navigation Gauche - Desktop Only */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-primary/90 hover:scale-110 active:scale-95 md:flex"
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Bouton Navigation Droite - Desktop Only */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-primary/90 hover:scale-110 active:scale-95 md:flex"
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Conteneur Scroll Horizontal */}
        <div
          ref={containerRef}
          className={cn(
            "overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 scroll-smooth",
            "px-6 md:px-8"
          )}
        >
          <StaggerContainer
            staggerDelay={0.05}
            className="flex gap-10 md:gap-12"
          >
            {displayedProperties.map((property, index) => (
              <motion.div
                key={property.id}
                variants={staggerItem}
                className="relative shrink-0 snap-start"
                style={{
                  width: "min(80%, 280px)",
                  minWidth: "280px"
                }}
              >
                {/* Badge optionnel */}
                {badge && (
                  <div className="absolute left-3 top-3 z-20 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                    {badge}
                  </div>
                )}
                <PropertyCard
                  property={property}
                  className="w-full min-w-[280px] md:min-w-[320px]"
                  priority={index < 2}
                />
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </div>

      {/* Bouton "Voir plus" */}
      {hasMore && showViewMore && (
        <FadeIn>
          <div className="flex justify-center px-4 pt-4 md:px-0">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
            >
              <Link href={href}>
                Voir plus ({properties.length - displayedProperties.length} autres)
              </Link>
            </Button>
          </div>
        </FadeIn>
      )}
    </section>
  );
};
