"use client";

import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, FileSignature, CheckCircle2 } from "lucide-react";

const trustFeatures = [
  {
    icon: ShieldCheck,
    title: "Annonces Vérifiées",
    description: "Chaque bien est inspecté avant mise en ligne. Fini les visites fantômes.",
    highlights: ["Photos authentiques", "Visite confirmée", "Prix vérifié"],
  },
  {
    icon: UserCheck,
    title: "Propriétaires Certifiés",
    description: "Identité des bailleurs vérifiée pour votre sécurité.",
    highlights: ["Identité vérifiée", "Titre de propriété", "Contact direct"],
  },
  {
    icon: FileSignature,
    title: "Bail Numérique",
    description: "Contrat clair, légal et signé électroniquement.",
    highlights: ["Conforme OHADA", "Signature sécurisée", "Archivage légal"],
  },
];

export default function TrustSection() {
  return (
    <section className="relative py-24 bg-black overflow-hidden">
      {/* Subtle Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-50 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[#F4C430] text-sm font-medium tracking-widest uppercase">
              Sécurité & Confiance
            </span>
          </div>

          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] text-white mb-4">
            Louez sans crainte,{" "}
            <span className="text-[#F4C430]">vivez sereinement</span>
          </h2>

          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Contrairement aux courtiers informels, chaque annonce et chaque propriétaire
            sur Dousell est vérifié. Votre tranquillité d'esprit est notre priorité.
          </p>
        </motion.div>

        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl bg-white/[0.02] border border-white/5 p-8 transition-all duration-500 hover:border-[#F4C430]/30 hover:bg-white/[0.04]">

                {/* Icon container */}
                <div className="mb-6 inline-flex p-3 rounded-xl bg-white/5 text-[#F4C430] ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#F4C430] transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                  {feature.highlights.map((highlight, idx) => (
                    <div
                      key={highlight}
                      className="flex items-center gap-2.5"
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0 text-[#F4C430]"
                      />
                      <span className="text-sm text-gray-300">{highlight}</span>
                    </div>
                  ))}
                </div>
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
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
            <span>+500 biens vérifiés</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
            <span>100% propriétaires certifiés</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
            <span>Baux conformes OHADA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
