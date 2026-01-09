"use client";

import { motion } from "framer-motion";

interface ShimmerEffectProps {
  /**
   * Durée de l'animation en secondes
   */
  duration?: number;
  /**
   * Délai avant la répétition en secondes
   */
  repeatDelay?: number;
  /**
   * Intensité de l'effet (opacité)
   */
  intensity?: "subtle" | "medium" | "strong";
  /**
   * Direction de l'effet
   */
  direction?: "horizontal" | "vertical" | "diagonal";
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

const intensityMap = {
  subtle: "via-[#F4C430]/5",
  medium: "via-[#F4C430]/10",
  strong: "via-[#F4C430]/20",
};

const directionMap = {
  horizontal: {
    gradient: "bg-gradient-to-r",
    animate: { x: ["-100%", "100%"] },
  },
  vertical: {
    gradient: "bg-gradient-to-b",
    animate: { y: ["-100%", "100%"] },
  },
  diagonal: {
    gradient: "bg-gradient-to-br",
    animate: { x: ["-100%", "100%"], y: ["-50%", "50%"] },
  },
};

/**
 * Effet shimmer or réutilisable
 * Design System: Luxe & Teranga - Couleur primaire #F4C430
 *
 * @example
 * ```tsx
 * // Shimmer subtil horizontal
 * <ShimmerEffect intensity="subtle" direction="horizontal" />
 *
 * // Effet intense diagonal pour CTA premium
 * <ShimmerEffect intensity="strong" direction="diagonal" duration={2} />
 * ```
 */
export const ShimmerEffect = ({
  duration = 3,
  repeatDelay = 4,
  intensity = "medium",
  direction = "horizontal",
  className = "",
}: ShimmerEffectProps) => {
  const config = directionMap[direction];
  const intensityClass = intensityMap[intensity];

  return (
    <motion.div
      className={`absolute inset-0 ${config.gradient} from-transparent ${intensityClass} to-transparent ${className}`}
      animate={config.animate}
      transition={{
        duration,
        repeat: Infinity,
        repeatDelay,
        ease: "easeInOut",
      }}
    />
  );
};
