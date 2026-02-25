"use client";

import { useEffect, useCallback, useState } from "react";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PropertyLightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export function PropertyLightbox({
    images,
    initialIndex,
    isOpen,
    onClose,
}: PropertyLightboxProps) {
    // Main Carousel
    const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: true, align: "center" });
    // Thumbnails Carousel
    const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
        containScroll: "keepSnaps",
        dragFree: true,
        align: "start",
    });

    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Sync Main -> State
    const onSelect = useCallback(() => {
        if (!emblaMainApi || !emblaThumbsApi) return;
        const index = emblaMainApi.selectedScrollSnap();
        setCurrentIndex(index);
        emblaThumbsApi.scrollTo(index);
    }, [emblaMainApi, emblaThumbsApi]);

    // Handle Thumbnail Click
    const onThumbClick = useCallback(
        (index: number) => {
            if (!emblaMainApi || !emblaThumbsApi) return;
            emblaMainApi.scrollTo(index);
        },
        [emblaMainApi, emblaThumbsApi]
    );

    // Initialize & Sync
    useEffect(() => {
        if (!emblaMainApi) return;

        emblaMainApi.scrollTo(initialIndex, true); // Immediate scroll
        emblaMainApi.on("select", onSelect);
        emblaMainApi.on("reInit", onSelect);

        // Initial sync of thumbnail scroll
        if (emblaThumbsApi) {
            emblaThumbsApi.scrollTo(initialIndex, true);
        }

        return () => {
            emblaMainApi.off("select", onSelect);
            emblaMainApi.off("reInit", onSelect);
        };
    }, [emblaMainApi, emblaThumbsApi, onSelect, initialIndex, isOpen]);


    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") emblaMainApi?.scrollPrev();
            if (e.key === "ArrowRight") emblaMainApi?.scrollNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, emblaMainApi]);

    // Prevent scrolling body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={(e) => {
                        // Only close if clicking the backdrop itself
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    {/* Top Controls */}
                    <div className="absolute top-[calc(env(safe-area-inset-top,0px))] left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6 text-white bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                        <div className="text-sm font-medium tracking-wide bg-black/40 px-3 py-1 rounded-full backdrop-blur-md pointer-events-auto">
                            {currentIndex + 1} / {images.length}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full w-12 h-12 pointer-events-auto active:scale-90 transition-transform"
                        >
                            <X className="w-8 h-8" />
                            <span className="sr-only">Fermer</span>
                        </Button>
                    </div>

                    {/* Navigation Arrows (Desktop) */}
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex justify-between px-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="pointer-events-auto text-white hover:bg-white/10 rounded-full w-14 h-14 backdrop-blur-[2px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                emblaMainApi?.scrollPrev();
                            }}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="pointer-events-auto text-white hover:bg-white/10 rounded-full w-14 h-14 backdrop-blur-[2px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                emblaMainApi?.scrollNext();
                            }}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>

                    {/* Main Carousel Area */}
                    <div className="w-full flex-1 flex items-center justify-center overflow-hidden relative" ref={emblaMainRef}>
                        <div className="flex w-full h-full touch-pan-y">
                            {images.map((src, index) => (
                                <div
                                    key={`main-${src}-${index}`}
                                    className="relative flex-[0_0_100%] w-full h-full flex items-center justify-center p-4 md:p-12"
                                    onClick={(e) => {
                                        // Allow closing when clicking empty space around image in the slide
                                        if (e.target === e.currentTarget) onClose();
                                    }}
                                >
                                    <div className="relative w-full h-full max-w-[90vw] max-h-[75vh]">
                                        <CldImageSafe
                                            src={src}
                                            alt={`Vue ${index + 1}`}
                                            fill
                                            className="object-contain"
                                            quality={95}
                                            priority={Math.abs(index - currentIndex) <= 1}
                                            sizes="100vw"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Thumbnails Strip */}
                    <div className="w-full h-24 md:h-28 bg-black/80 flex items-center z-20 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
                        <div className="w-full max-w-5xl mx-auto px-4 overflow-hidden" ref={emblaThumbsRef}>
                            <div className="flex gap-2">
                                {images.map((src, index) => (
                                    <button
                                        key={`thumb-${src}-${index}`}
                                        onClick={() => onThumbClick(index)}
                                        className={cn(
                                            "relative flex-[0_0_64px] md:flex-[0_0_100px] h-16 md:h-20 rounded-xl overflow-hidden transition-all duration-200 border-2 no-select",
                                            index === currentIndex
                                                ? "border-primary opacity-100 ring-2 ring-primary/20"
                                                : "border-transparent opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        <CldImageSafe
                                            src={src}
                                            alt={`Miniature ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="150px"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
