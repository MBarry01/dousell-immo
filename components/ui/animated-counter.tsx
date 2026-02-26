"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  /**
   * Valeur finale du compteur
   */
  value: number;
  /**
   * Suffixe à afficher après le nombre (ex: "+", "K", "%")
   */
  suffix?: string;
  /**
   * Préfixe à afficher avant le nombre (ex: "$", "€")
   */
  prefix?: string;
  /**
   * Durée de l'animation en secondes
   */
  duration?: number;
  /**
   * Délai avant le début de l'animation
   */
  delay?: number;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Nombre de décimales à afficher
   */
  decimals?: number;
}

/**
 * Compteur animé qui s'incrémente de 0 à la valeur finale
 * Inspiré de saasable-ui/Metrics5
 *
 * @example
 * ```tsx
 * <AnimatedCounter value={500} suffix="+" />
 * <AnimatedCounter value={98} suffix="%" />
 * <AnimatedCounter value={1.5} suffix="M" prefix="$" decimals={1} />
 * ```
 */
export const AnimatedCounter = ({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  delay = 0,
  className = "",
  decimals = 0,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    current.toFixed(decimals)
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasAnimated, spring, value, delay]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

interface MetricCardProps {
  /**
   * Valeur numérique à afficher
   */
  value: number;
  /**
   * Suffixe (ex: "+", "K", "%")
   */
  suffix?: string;
  /**
   * Label descriptif sous le nombre
   */
  label: string;
  /**
   * Délai d'animation (pour effet staggered)
   */
  delay?: number;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Carte métrique avec compteur animé
 * Style Dousel - Design System "Luxe & Teranga"
 */
export const MetricCard = ({
  value,
  suffix = "",
  label,
  delay = 0,
  className = "",
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.215, 0.61, 0.355, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm ${className}`}
    >
      {/* Shimmer subtil */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <div className="flex items-baseline gap-1">
          <AnimatedCounter
            value={value}
            suffix=""
            duration={2.5}
            delay={delay + 0.3}
            className="text-4xl font-bold text-white md:text-5xl"
          />
          <span className="text-2xl font-semibold text-[#F4C430] md:text-3xl">
            {suffix}
          </span>
        </div>
        <p className="text-sm text-white/60 md:text-base">{label}</p>
      </div>
    </motion.div>
  );
};
