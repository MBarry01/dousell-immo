"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GalleryGridProps = {
  propertyId: string;
  title: string;
  images: string[];
};

export const GalleryGrid = ({
  propertyId,
  title,
  images,
}: GalleryGridProps) => {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    align: "start",
    watchDrag: true,
    watchResize: true,
  });

  // Suivre l'index sélectionné dans le carousel
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  // Mobile: Carousel
  const mobileView = (
    <div className="relative h-[50vh] w-full overflow-hidden rounded-b-[32px] md:hidden touch-pan-y">
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((src, index) => (
            <div
              key={`${propertyId}-${src}-${index}`}
              className="relative h-[50vh] min-w-full shrink-0 overflow-hidden touch-none"
            >
              <Image
                src={src}
                alt={`${title} visuel ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                quality={75}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-md">
        {selectedIndex + 1}/{images.length}
      </div>
      {/* Dots indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                selectedIndex === index ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Desktop: Bento Grid
  const desktopView = (
    <div className="relative hidden h-[400px] w-full overflow-hidden rounded-2xl md:grid md:grid-cols-4 md:grid-rows-2 md:gap-2">
      {/* Image 1 - Grande à gauche */}
      {images[0] && (
        <div className="relative col-span-2 row-span-2 overflow-hidden rounded-l-2xl">
          <Image
            src={images[0]}
            alt={`${title} - Photo principale`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={75}
          />
        </div>
      )}

      {/* Images 2-5 */}
      {images.slice(1, 5).map((src, index) => {
        const positions = [
          { rounded: "rounded-tr-2xl" }, // Image 2
          {}, // Image 3
          {}, // Image 4
          { rounded: "rounded-br-2xl" }, // Image 5
        ];
        return (
          <div
            key={`grid-${index + 1}`}
            className={`relative overflow-hidden ${positions[index]?.rounded || ""}`}
          >
            <Image
              src={src}
              alt={`${title} - Photo ${index + 2}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
              quality={75}
            />
          </div>
        );
      })}

      {/* Bouton "Afficher toutes les photos" */}
      {images.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 right-4 z-10"
        >
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAllPhotos(true);
            }}
            className="rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:bg-primary/90"
          >
            Afficher toutes les photos
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}

      {/* Dialog pour toutes les photos */}
      <Dialog open={showAllPhotos} onOpenChange={setShowAllPhotos}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {images.length} photo{images.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((src, index) => (
              <div
                key={`modal-${index}`}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={src}
                  alt={`${title} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={75}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

