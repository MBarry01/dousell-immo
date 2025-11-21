"use client";

import { useRef, useState, useEffect } from "react";
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
  if (!properties.length) return null;

  const displayedProperties = limit ? properties.slice(0, limit) : properties;
  const hasMore = limit && properties.length > limit;

  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const checkScrollButtons = () => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [displayedProperties]);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;

    const scrollAmount = 320; // Largeur de la carte + gap
    const scrollDirection = direction === "left" ? -scrollAmount : scrollAmount;

    containerRef.current.scrollBy({
      left: scrollDirection,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-4">
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
        {showLeftButton && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 md:flex"
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Bouton Navigation Droite - Desktop Only */}
        {showRightButton && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 md:flex"
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
            className="flex gap-8"
          >
            {displayedProperties.map((property) => (
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
                  <div className="absolute left-3 top-3 z-20 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-md">
                    {badge}
                  </div>
                )}
                <PropertyCard 
                  property={property} 
                  className="w-full min-w-[280px] md:min-w-[320px]" 
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
