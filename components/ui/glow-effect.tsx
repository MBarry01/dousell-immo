"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlowEffectProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /**
   * Contenu à entourer de la lueur
   */
  children: ReactNode;
  /**
   * Intensité de la lueur
   */
  intensity?: "subtle" | "medium" | "strong";
  /**
   * Type d'animation
   */
  animation?: "pulse" | "hover" | "static";
  /**
   * Couleur de la lueur (défaut: or #F4C430)
   */
  color?: string;
  /**
   * Classes CSS additionnelles pour le conteneur
   */
  className?: string;
}

const intensityMap = {
  subtle: {
    blur: "blur-xl",
    opacity: "opacity-20",
    spread: "inset-2",
  },
  medium: {
    blur: "blur-2xl",
    opacity: "opacity-30",
    spread: "inset-4",
  },
  strong: {
    blur: "blur-3xl",
    opacity: "opacity-40",
    spread: "inset-6",
  },
};

/**
 * Effet de lueur or autour des éléments
 * Design System: Luxe & Teranga - Couleur primaire #F4C430
 *
 * @example
 * ```tsx
 * // Lueur statique subtile
 * <GlowEffect intensity="subtle" animation="static">
 *   <Button>Mon Bouton</Button>
 * </GlowEffect>
 *
 * // Lueur pulsante forte pour éléments premium
 * <GlowEffect intensity="strong" animation="pulse">
 *   <Card>Contenu Premium</Card>
 * </GlowEffect>
 *
 * // Lueur au hover
 * <GlowEffect intensity="medium" animation="hover">
 *   <PropertyCard {...props} />
 * </GlowEffect>
 * ```
 */
export const GlowEffect = ({
  children,
  intensity = "medium",
  animation = "hover",
  color = "#F4C430",
  className = "",
  ...motionProps
}: GlowEffectProps) => {
  const config = intensityMap[intensity];

  const getAnimationProps = () => {
    switch (animation) {
      case "pulse":
        return {
          animate: {
            opacity: [0.2, 0.4, 0.2],
            scale: [0.98, 1.02, 0.98],
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };
      case "hover":
        return {
          initial: { opacity: 0 },
          whileHover: { opacity: 1 },
          transition: { duration: 0.3 },
        };
      case "static":
        return {
          initial: { opacity: 1 },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div className={`relative ${className}`} {...motionProps}>
      {/* Effet de lueur en arrière-plan */}
      <motion.div
        className={`absolute -${config.spread} rounded-3xl ${config.blur} -z-10`}
        style={{
          background: `radial-gradient(circle, ${color}40 0%, ${color}20 50%, transparent 100%)`,
        }}
        {...getAnimationProps()}
      />
      {children}
    </motion.div>
  );
};
