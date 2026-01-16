"use client";

import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, FileSignature, CheckCircle2 } from "lucide-react";

const trustFeatures = [
  {
    icon: ShieldCheck,
    title: "Annonces Vérifiées",
    description: "Chaque bien est inspecté avant mise en ligne. Fini les visites fantômes.",
    color: "#10B981", // emerald
    highlights: ["Photos authentiques", "Visite confirmée", "Prix vérifié"],
  },
  {
    icon: UserCheck,
    title: "Propriétaires Certifiés",
    description: "Identité des bailleurs vérifiée pour votre sécurité.",
    color: "#F4C430", // gold
    highlights: ["Identité vérifiée", "Titre de propriété", "Contact direct"],
  },
  {
    icon: FileSignature,
    title: "Bail Numérique",
    description: "Contrat clair, légal et signé électroniquement.",
    color: "#3B82F6", // blue
    highlights: ["Conforme OHADA", "Signature sécurisée", "Archivage légal"],
  },
];

export default function TrustSection() {
  return (
    <section className="relative py-24 bg-zinc-950 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F4C430]/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium tracking-wide">
              Sécurité & Confiance
            </span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Louez sans crainte,{" "}
            <span className="text-emerald-400">vivez sereinement</span>
          </h2>

          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Contrairement aux courtiers informels, chaque annonce et chaque propriétaire
            sur Dousell est vérifié. Votre tranquillité d'esprit est notre priorité.
          </p>
        </motion.div>

        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative h-full rounded-3xl bg-zinc-900/50 border border-white/5 p-8 transition-all duration-500 hover:border-white/10 hover:bg-zinc-900/80 overflow-hidden">
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${feature.color}15 0%, transparent 60%)`
                  }}
                />

                {/* Icon container */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative mb-6"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: `${feature.color}15`,
                      boxShadow: `0 0 30px ${feature.color}20`
                    }}
                  >
                    <feature.icon
                      className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
                      style={{ color: feature.color }}
                    />
                  </div>

                  {/* Animated ring */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      border: `2px solid ${feature.color}30`,
                      animation: "pulse 2s ease-in-out infinite"
                    }}
                  />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2.5">
                  {feature.highlights.map((highlight, idx) => (
                    <motion.div
                      key={highlight}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + idx * 0.1 + 0.3 }}
                      className="flex items-center gap-2.5"
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: feature.color }}
                      />
                      <span className="text-sm text-gray-300">{highlight}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>+500 biens vérifiés</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F4C430]" />
            <span>100% propriétaires certifiés</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Baux conformes OHADA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
