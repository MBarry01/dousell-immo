"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface MetricItem {
  /**
   * Valeur numérique
   */
  value: number;
  /**
   * Suffixe (ex: "+", "K", "%")
   */
  suffix?: string;
  /**
   * Préfixe (ex: "€", "$")
   */
  prefix?: string;
  /**
   * Label descriptif
   */
  label: string;
}

interface MetricsSectionProps {
  /**
   * Titre de la section
   */
  heading?: string;
  /**
   * Sous-titre de la section
   */
  caption?: string;
  /**
   * Liste des métriques (max 4 recommandé)
   */
  metrics: MetricItem[];
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Section de métriques avec compteurs animés
 * Inspiré de saasable-ui/Metrics5
 */
export const MetricsSection = ({
  heading,
  caption,
  metrics,
  className = "",
}: MetricsSectionProps) => {
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.1,
                ease: [0.215, 0.61, 0.355, 1],
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-[#F4C430]/20 hover:bg-white/[0.07] md:p-8"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                <div className="flex items-baseline gap-1">
                  {metric.prefix && (
                    <span className="text-2xl font-semibold text-white/70 md:text-3xl">
                      {metric.prefix}
                    </span>
                  )}
                  <AnimatedCounter
                    value={metric.value}
                    duration={2.5}
                    delay={0.3 + index * 0.15}
                    className="text-4xl font-bold text-white md:text-5xl"
                  />
                  {metric.suffix && (
                    <span className="text-2xl font-semibold text-[#F4C430] md:text-3xl">
                      {metric.suffix}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60 md:text-base">
                  {metric.label}
                </p>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute -inset-1 rounded-2xl bg-[#F4C430]/5 blur-xl" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
