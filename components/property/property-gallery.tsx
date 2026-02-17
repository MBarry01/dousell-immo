"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";

type PropertyGalleryProps = {
  propertyId: string;
  title: string;
  images: string[];
};

export const PropertyGallery = ({
  propertyId,
  title,
  images,
}: PropertyGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    align: "start",
    watchDrag: true,
    watchResize: true,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Mémoriser les images pour éviter les re-renders inutiles
  const memoizedImages = useMemo(() => images, [images]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  return (
    <motion.div
      className="relative h-[50vh] w-full overflow-hidden rounded-b-[32px] touch-pan-y"
      layoutId={`property-image-${propertyId}`}
    >
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {memoizedImages.map((src, index) => (
            <div
              className="relative h-[50vh] min-w-full shrink-0 overflow-hidden touch-pan-y"
              key={`${propertyId}-${src}-${index}`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={src}
                  alt={`${title} visuel ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="100vw"
                  quality={75}
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-md">
        {selectedIndex + 1}/{images.length}
      </div>
      <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={`dot-${index}`}
            type="button"
            onClick={() => scrollTo(index)}
            className={`h-2.5 rounded-full transition-all ${selectedIndex === index ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

