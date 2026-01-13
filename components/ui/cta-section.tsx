"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
  /**
   * Badge/Label au-dessus du titre
   */
  label?: string;
  /**
   * Titre principal
   */
  heading: string;
  /**
   * Description
   */
  caption?: string;
  /**
   * Texte du bouton principal
   */
  primaryButtonText: string;
  /**
   * Lien du bouton principal
   */
  primaryButtonHref: string;
  /**
   * Texte du bouton secondaire (optionnel)
   */
  secondaryButtonText?: string;
  /**
   * Lien du bouton secondaire
   */
  secondaryButtonHref?: string;
  /**
   * Statistique à afficher (optionnel)
   */
  stat?: {
    value: string;
    label: string;
  };
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Section Call-to-Action premium
 * Inspiré de saasable-ui/Cta5
 *
 * @example
 * ```tsx
 * <CTASection
 *   label="Prêt à investir ?"
 *   heading="Trouvez votre bien idéal au Sénégal"
 *   caption="Plus de 500 propriétés vérifiées vous attendent."
 *   primaryButtonText="Découvrir les biens"
 *   primaryButtonHref="/recherche"
 *   stat={{ value: "98%", label: "Clients satisfaits" }}
 * />
 * ```
 */
export const CTASection = ({
  label,
  heading,
  caption,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  stat,
  className = "",
}: CTASectionProps) => {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-1"
        >
          <div className="rounded-[22px] bg-[#0a0d14] p-8 md:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-[1fr,auto] lg:items-center">
              {/* Contenu principal */}
              <div className="space-y-6">
                {/* Label/Badge */}
                {label && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <span className="rounded-full border border-[#F4C430]/30 bg-[#F4C430]/10 px-4 py-1.5 text-sm font-medium text-[#F4C430]">
                      {label}
                    </span>
                    <div className="h-px w-16 bg-gradient-to-r from-white/30 to-transparent" />
                  </motion.div>
                )}

                {/* Titre */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
                >
                  {heading}
                </motion.h2>

                {/* Description */}
                {caption && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="max-w-xl text-lg text-white/60"
                  >
                    {caption}
                  </motion.p>
                )}

                {/* Boutons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" className="h-12 gap-2 rounded-full px-8">
                      <Link href={primaryButtonHref}>
                        <Sparkles className="h-4 w-4" />
                        {primaryButtonText}
                      </Link>
                    </Button>
                  </motion.div>

                  {secondaryButtonText && secondaryButtonHref && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-12 gap-2 rounded-full border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
                      >
                        <Link href={secondaryButtonHref}>
                          {secondaryButtonText}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Statistique à droite */}
              {stat && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
                >
                  <span className="text-5xl font-bold text-[#F4C430] md:text-6xl">
                    {stat.value}
                  </span>
                  <span className="mt-2 text-sm text-white/60">{stat.label}</span>
                </motion.div>
              )}
            </div>

            {/* Décoration de fond - Logo watermark */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 opacity-5">
              <svg
                width="300"
                height="300"
                viewBox="0 0 100 100"
                fill="currentColor"
                className="text-[#F4C430]"
              >
                <circle cx="50" cy="50" r="45" />
              </svg>
            </div>
          </div>

          {/* Effet de brillance animé */}
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ["0%", "200%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
};
