"use client";

import { motion } from "framer-motion";

interface GoldParticlesProps {
  count?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  opacity?: number;
  speed?: "slow" | "medium" | "fast";
}

const sizeMap = {
  sm: "w-0.5 h-0.5",
  md: "w-1 h-1",
  lg: "w-1.5 h-1.5",
};

const speedMap = {
  slow: { min: 8, max: 12 },
  medium: { min: 5, max: 8 },
  fast: { min: 3, max: 5 },
};

/**
 * Composant d'effets de particules or animées
 * Design System: Luxe & Teranga - Couleur primaire #F4C430
 *
 * @example
 * ```tsx
 * // Particules légères en arrière-plan
 * <GoldParticles count={8} size="sm" opacity={0.3} speed="slow" />
 *
 * // Effet intense pour sections premium
 * <GoldParticles count={20} size="md" opacity={0.6} speed="medium" />
 * ```
 */
export const GoldParticles = ({
  count = 12,
  className = "",
  size = "md",
  opacity = 0.4,
  speed = "medium",
}: GoldParticlesProps) => {
  const particles = Array.from({ length: count }, (_, i) => i);
  const speedConfig = speedMap[speed];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((i) => {
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomEndY = Math.random() * 100;
        const duration = Math.random() * (speedConfig.max - speedConfig.min) + speedConfig.min;
        const delay = Math.random() * 3;

        return (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-[#F4C430] ${sizeMap[size]}`}
            initial={{
              x: `${randomX}%`,
              y: `${randomY}%`,
              opacity: 0,
            }}
            animate={{
              y: [`${randomY}%`, `${randomEndY}%`],
              opacity: [0, opacity, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};
