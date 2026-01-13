"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

interface TestimonialItem {
  /**
   * Note sur 5
   */
  rating: number;
  /**
   * Titre du témoignage
   */
  title: string;
  /**
   * Contenu du témoignage
   */
  content: string;
  /**
   * Nom de l'auteur
   */
  name: string;
  /**
   * Rôle/Titre de l'auteur
   */
  role: string;
  /**
   * URL de la photo de profil (optionnel)
   */
  avatar?: string;
}

interface TestimonialMasonryProps {
  /**
   * Titre de la section
   */
  heading?: string;
  /**
   * Sous-titre de la section
   */
  caption?: string;
  /**
   * Liste des témoignages
   */
  testimonials: TestimonialItem[];
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Section de témoignages en grille masonry
 * Inspiré de saasable-ui/Testimonial10
 *
 * @example
 * ```tsx
 * <TestimonialMasonry
 *   heading="Ce que disent nos clients"
 *   testimonials={[
 *     { rating: 5, title: "Excellent service", content: "...", name: "Marie D.", role: "Propriétaire" },
 *   ]}
 * />
 * ```
 */
export const TestimonialMasonry = ({
  heading,
  caption,
  testimonials,
  className = "",
}: TestimonialMasonryProps) => {
  // Diviser les témoignages en colonnes pour l'effet masonry
  const columns: TestimonialItem[][] = [[], [], []];
  testimonials.forEach((item, index) => {
    columns[index % 3].push(item);
  });

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

        {/* Masonry Grid */}
        <div className="relative">
          {/* Gradient overlay en bas */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05080c] to-transparent" />

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4">
                {column.map((testimonial, index) => (
                  <TestimonialCard
                    key={index}
                    testimonial={testimonial}
                    delay={colIndex * 0.1 + index * 0.15}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface TestimonialCardProps {
  testimonial: TestimonialItem;
  delay: number;
}

const TestimonialCard = ({ testimonial, delay }: TestimonialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-[#F4C430]/20 hover:bg-white/[0.07]"
    >
      {/* Rating */}
      <div className="mb-3 flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < testimonial.rating
                ? "fill-[#F4C430] text-[#F4C430]"
                : "text-white/20"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <h4 className="mb-2 font-semibold text-white">{testimonial.title}</h4>
      <p className="mb-4 text-sm leading-relaxed text-white/60">
        {testimonial.content}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {testimonial.avatar ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4C430]/20">
            <span className="text-sm font-semibold text-[#F4C430]">
              {testimonial.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-white">{testimonial.name}</p>
          <p className="text-xs text-white/50">{testimonial.role}</p>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#F4C430]/10 via-transparent to-[#F4C430]/10 blur-xl" />
      </div>
    </motion.div>
  );
};
