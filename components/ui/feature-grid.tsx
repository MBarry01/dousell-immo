"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  Home,
  Shield,
  FileText,
  MapPin,
  Clock,
  Users,
  BadgeCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Mapping des noms d'icônes vers les composants Lucide
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  shield: Shield,
  fileText: FileText,
  mapPin: MapPin,
  clock: Clock,
  users: Users,
  badgeCheck: BadgeCheck,
  sparkles: Sparkles,
};

interface FeatureItem {
  /**
   * Nom de l'icône (from iconMap) ou composant React
   */
  icon: string | ReactNode;
  /**
   * Titre de la feature
   */
  title: string;
  /**
   * Description de la feature
   */
  description: string;
}

interface FeatureGridProps {
  /**
   * Titre de la section
   */
  heading?: string;
  /**
   * Sous-titre de la section
   */
  caption?: string;
  /**
   * Liste des features à afficher
   */
  features: FeatureItem[];
  /**
   * Nombre de colonnes sur grand écran
   */
  columns?: 2 | 3 | 4;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Grille de features avec animations staggered
 * Inspiré de saasable-ui/Feature20
 *
 * @example
 * ```tsx
 * <FeatureGrid
 *   heading="Pourquoi Dousell ?"
 *   features={[
 *     { icon: "shield", title: "100% Sécurisé", description: "..." },
 *     { icon: "badgeCheck", title: "Biens Vérifiés", description: "..." },
 *   ]}
 * />
 * ```
 */
export const FeatureGrid = ({
  heading,
  caption,
  features,
  columns = 3,
  className = "",
}: FeatureGridProps) => {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        {(heading || caption) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 text-center"
          >
            {heading && (
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                {heading}
              </h2>
            )}
            {caption && (
              <p className="mx-auto max-w-2xl text-lg text-white/60">
                {caption}
              </p>
            )}
          </motion.div>
        )}

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm md:rounded-3xl"
        >
          <div
            className={`grid grid-cols-1 divide-y divide-white/10 ${gridCols[columns]} md:divide-y-0`}
          >
            {features.map((feature, index) => {
              // Résoudre l'icône
              const IconComponent =
                typeof feature.icon === "string"
                  ? iconMap[feature.icon] || Sparkles
                  : null;

              const isLastInRow = (index + 1) % columns === 0;
              const isLastRow =
                index >= features.length - (features.length % columns || columns);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 * index,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className={`relative p-6 md:p-8 ${
                    !isLastInRow ? "md:border-r md:border-white/10" : ""
                  } ${!isLastRow ? "md:border-b md:border-white/10" : ""}`}
                >
                  {/* Icône animée */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 * index }}
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4C430]/10"
                  >
                    {IconComponent ? (
                      <IconComponent className="h-7 w-7 text-[#F4C430]" />
                    ) : (
                      feature.icon
                    )}
                  </motion.div>

                  {/* Contenu */}
                  <motion.h3
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 * index }}
                    className="mb-2 text-lg font-semibold text-white md:text-xl"
                  >
                    {feature.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 * index }}
                    className="text-sm text-white/60 md:text-base"
                  >
                    {feature.description}
                  </motion.p>

                  {/* Décoration en coin (étoile) */}
                  {!isLastInRow && !isLastRow && (
                    <div className="absolute -bottom-2 -right-2 hidden h-4 w-4 md:block">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="h-4 w-4 text-[#F4C430]/30"
                      >
                        <path
                          d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
