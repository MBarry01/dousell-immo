"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

type ListingImageCarouselProps = {
  images: string[];
  alt: string;
  className?: string;
};

export const ListingImageCarousel = ({
  images,
  alt,
  className,
}: ListingImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    watchDrag: true,
    watchResize: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      emblaApi?.scrollPrev();
    },
    [emblaApi]
  );

  const scrollNext = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      emblaApi?.scrollNext();
    },
    [emblaApi]
  );

  const scrollTo = useCallback(
    (index: number) => (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const handleImageError = useCallback((src: string) => {
    console.warn(`[ListingImageCarousel] Image failed to load:`, src);
    setFailedImages((prev) => new Set(prev).add(src));
  }, []);

  // Filtrer les images vides ou invalides, puis celles qui ont échoué
  const validImagesList = images
    .filter((src) => src && typeof src === "string" && src.length > 0)
    .filter((src) => !failedImages.has(src));

  if (validImagesList.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50",
          className
        )}
      >
        <div className="text-center text-xs">
          <svg
            className="mx-auto mb-2 h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Image non disponible</p>
        </div>
      </div>
    );
  }

  const dots = validImagesList.slice(0, 5);
  const hasOverflow = validImagesList.length > dots.length;

  return (
    <div 
      className={cn("group relative h-full w-full overflow-hidden touch-pan-y", className)}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        // Empêcher la navigation si on commence un drag
        const startX = e.clientX;
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const diffX = Math.abs(moveEvent.clientX - startX);
          if (diffX > 5) {
            // C'est un drag, empêcher la navigation
            e.stopPropagation();
          }
        };
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove as any);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove as any);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    >
      <div ref={emblaRef} className="h-full w-full">
        <div className="flex h-full">
          {validImagesList.map((src, index) => (
            <div
              className="relative h-full min-w-full shrink-0 touch-none"
              key={`${src}-${index}`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={src}
                  alt={`${alt} visuel ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                  onError={() => handleImageError(src)}
                  unoptimized={src.includes("pexels.com") || src.includes("unsplash.com")}
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows (desktop) */}
      {validImagesList.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Image précédente"
            onClick={scrollPrev}
            className="hidden sm:flex absolute left-3 top-1/2 z-20 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Image suivante"
            onClick={scrollNext}
            className="hidden sm:flex absolute right-3 top-1/2 z-20 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {validImagesList.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {dots.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={scrollTo(index)}
              className={cn(
                "pointer-events-auto h-1.5 rounded-full transition",
                selectedIndex === index ? "w-4 bg-white" : "w-2 bg-white/50",
                hasOverflow && index === dots.length - 1 && validImagesList.length > dots.length
                  ? "opacity-70"
                  : ""
              )}
            />
          ))}
          {hasOverflow && (
            <span className="pointer-events-none ml-2 text-xs text-white/70">
              +{validImagesList.length - dots.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
