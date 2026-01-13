"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, ChevronDown } from "lucide-react";

interface HeroPremiumProps {
  /**
   * Badge/Chip au-dessus du titre
   */
  badge?: {
    text: string;
    highlight?: string;
  };
  /**
   * Titre principal
   */
  headline: string;
  /**
   * Sous-titre/Description
   */
  caption: string;
  /**
   * Bouton principal
   */
  primaryButton: {
    text: string;
    href: string;
  };
  /**
   * Bouton secondaire (optionnel)
   */
  secondaryButton?: {
    text: string;
    href: string;
  };
  /**
   * URL de la vidéo (MP4)
   */
  videoSrc?: string;
  /**
   * Image poster pour la vidéo
   */
  videoPoster?: string;
  /**
   * Image de fond si pas de vidéo
   */
  backgroundImage?: string;
  /**
   * Liste de technologies/badges à afficher
   */
  techBadges?: Array<{
    icon?: string;
    label: string;
  }>;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Section Hero Premium avec vidéo, parallax et animations
 * Inspiré de saasable-ui/Hero17 - Adapté pour Dousell Immo
 */
export const HeroPremium = ({
  badge,
  headline,
  caption,
  primaryButton,
  secondaryButton,
  videoSrc,
  videoPoster,
  backgroundImage = "/monument.png",
  techBadges,
  className = "",
}: HeroPremiumProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.92, 1]);

  return (
    <section
      ref={containerRef}
      className={`relative min-h-[100dvh] overflow-hidden ${className}`}
    >
      {/* Background avec effet de points */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Image/Video de fond avec parallax */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y: backgroundY, opacity }}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={videoPoster}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={backgroundImage}
            alt="Background"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080c]/80 via-[#05080c]/60 to-[#05080c]" />
      </motion.div>

      {/* Contenu */}
      <div className="container relative mx-auto flex min-h-[100dvh] flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge animé */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <motion.span
              animate={{
                boxShadow: [
                  "0 0 0px rgba(244, 196, 48, 0)",
                  "0 0 20px rgba(244, 196, 48, 0.4)",
                  "0 0 0px rgba(244, 196, 48, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm"
            >
              <span className="text-sm text-white/70">{badge.text}</span>
              {badge.highlight && (
                <span className="rounded-full bg-[#F4C430]/20 px-3 py-0.5 text-sm font-medium text-[#F4C430]">
                  {badge.highlight}
                </span>
              )}
            </motion.span>
          </motion.div>
        )}

        {/* Titre principal */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {headline}
        </motion.h1>

        {/* Ligne décorative ondulée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-6"
        >
          <svg
            width="120"
            height="12"
            viewBox="0 0 120 12"
            fill="none"
            className="text-[#F4C430]"
          >
            <path
              d="M2 6C10 2 20 10 30 6C40 2 50 10 60 6C70 2 80 10 90 6C100 2 110 10 118 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-8 max-w-2xl text-lg text-white/70 sm:text-xl"
        >
          {caption}
        </motion.p>

        {/* Boutons CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="lg"
              className="h-14 gap-2 rounded-full px-8 text-base"
            >
              <Link href={primaryButton.href}>
                <Sparkles className="h-5 w-5" />
                {primaryButton.text}
              </Link>
            </Button>
          </motion.div>

          {secondaryButton && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 gap-2 rounded-full border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10"
              >
                <Link href={secondaryButton.href}>
                  <Play className="h-5 w-5" />
                  {secondaryButton.text}
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Tech badges */}
        {techBadges && techBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {techBadges.map((badge, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-sm"
              >
                {badge.icon && (
                  <Image
                    src={badge.icon}
                    alt={badge.label}
                    width={16}
                    height={16}
                  />
                )}
                {badge.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Indicateur de scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{
            opacity: { delay: 1.5, duration: 0.5 },
            y: { delay: 1.5, duration: 2, repeat: Infinity },
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-white/30" />
        </motion.div>
      </div>

      {/* Section Vidéo/Image Showcase avec scale parallax */}
      {videoSrc && (
        <div className="container mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 0.92 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 }}
            style={{ scale }}
          >
            <div className="overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl md:rounded-3xl">
              <video
                className="aspect-video w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={videoPoster}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
