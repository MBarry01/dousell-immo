"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}

export default function AceCompare({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}: CompareProps) {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;
      setSliderXPercent(percentage);
      autoplayRef.current = setTimeout(animate, 16);
    };
    animate();
  }, [autoplay, autoplayDuration]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);

  function mouseEnterHandler() {
    stopAutoplay();
  }
  function mouseLeaveHandler() {
    if (slideMode === "hover") setSliderXPercent(initialSliderPercentage);
    if (slideMode === "drag") setIsDragging(false);
    startAutoplay();
  }

  const handleStart = useCallback(() => {
    if (slideMode === "drag") setIsDragging(true);
  }, [slideMode]);

  const handleEnd = useCallback(() => {
    if (slideMode === "drag") setIsDragging(false);
  }, [slideMode]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = (x / rect.width) * 100;
        requestAnimationFrame(() => {
          setSliderXPercent(Math.max(0, Math.min(100, percent)));
        });
      }
    },
    [slideMode, isDragging]
  );

  const handleMouseDown = () => handleStart();
  const handleMouseUp = () => handleEnd();
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchStart = () => {
    if (!autoplay) handleStart();
  };
  const handleTouchEnd = () => {
    if (!autoplay) handleEnd();
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!autoplay) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={sliderRef}
      className={cn("w-full h-[400px] overflow-hidden select-none", className)}
      style={{
        position: "relative",
        cursor: slideMode === "drag" ? "grab" : "col-resize",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={mouseLeaveHandler}
      onMouseEnter={mouseEnterHandler}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="h-full w-px absolute top-0 m-auto z-30 bg-gradient-to-b from-transparent from-5% to-95% via-[#F4C430] to-transparent"
          style={{ left: `${sliderXPercent}%`, top: "0", zIndex: 40 }}
          transition={{ duration: 0 }}
        >
          <div className="w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-[#F4C430]/50 via-transparent to-transparent z-20 opacity-50" />
          <div className="w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-[#F4C430] via-transparent to-transparent z-10 opacity-100" />
          {showHandlebar && (
            <div className="h-6 w-6 rounded-full top-1/2 -translate-y-1/2 bg-[#F4C430] z-30 -right-3 absolute flex items-center justify-center shadow-lg border-2 border-white">
              <svg
                className="h-3 w-3 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Première image (Gauche / Avant) */}
      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                "absolute inset-0 z-20 rounded-2xl w-full h-full select-none overflow-hidden",
                firstImageClassName
              )}
              style={{ clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)` }}
              transition={{ duration: 0 }}
            >
              <Image
                alt="Avant"
                src={firstImage}
                fill
                className={cn("object-cover", firstImageClassName)}
                draggable={false}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Seconde image (Droite / Après) */}
      <AnimatePresence initial={false}>
        {secondImage ? (
          <motion.div className="absolute inset-0 z-10">
            <Image
              className={cn(
                "object-cover rounded-2xl w-full h-full select-none",
                secondImageClassname
              )}
              alt="Après"
              src={secondImage}
              fill
              draggable={false}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
