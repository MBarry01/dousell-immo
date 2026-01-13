"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface ParallaxVideoProps {
  /**
   * Source de la vidéo (URL MP4 ou WebM)
   */
  videoSrc?: string;
  /**
   * Image de prévisualisation (poster)
   */
  posterSrc?: string;
  /**
   * Fallback image si pas de vidéo
   */
  fallbackImage?: string;
  /**
   * Alt text pour l'image
   */
  alt?: string;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Activer l'effet parallax au scroll
   */
  enableParallax?: boolean;
}

/**
 * Composant vidéo avec effet parallax au scroll
 * Inspiré de saasable-ui/Hero17
 *
 * @example
 * ```tsx
 * <ParallaxVideo
 *   videoSrc="https://example.com/video.mp4"
 *   posterSrc="/thumbnail.jpg"
 *   enableParallax
 * />
 * ```
 */
export const ParallaxVideo = ({
  videoSrc,
  posterSrc,
  fallbackImage,
  alt = "Video",
  className = "",
  enableParallax = true,
}: ParallaxVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Effet parallax au scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.4, 0.6],
    [0.9, 0.92, 0.94, 0.96, 1]
  );

  // Lecture automatique avec IntersectionObserver
  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const options = { root: null, rootMargin: "0px", threshold: 0.6 };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isPlaying) {
          videoRef.current
            ?.play()
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.error("Autoplay prevented:", error);
              setHasError(true);
            });
        } else if (!entry.isIntersecting && isPlaying) {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    const videoElement = videoRef.current;

    if (videoElement) observer.observe(videoElement);

    return () => {
      if (videoElement) observer.unobserve(videoElement);
    };
  }, [isPlaying, videoSrc]);

  // Si pas de vidéo ou erreur, afficher l'image fallback
  const showFallback = !videoSrc || hasError;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 0.9 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay: 0.3 }}
      style={enableParallax ? { scale } : undefined}
      className={className}
    >
      <div className="relative overflow-hidden rounded-2xl border-4 border-white/10 bg-black/50 shadow-2xl md:rounded-3xl">
        {showFallback ? (
          // Afficher l'image fallback
          <div className="relative aspect-video w-full">
            <Image
              src={fallbackImage || posterSrc || "/monument.png"}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          // Afficher la vidéo
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            playsInline
            preload="metadata"
            autoPlay={false}
            loop
            muted
            poster={posterSrc}
            onError={() => setHasError(true)}
          >
            <source src={videoSrc} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}
      </div>
    </motion.div>
  );
};
