"use client";
import { motion } from "framer-motion";
import AceCompare from "@/components/ui/ace-compare";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

const features = [
  {
    title: "Fini la paperasse",
    description:
      "Remplacez vos piles de dossiers et fichiers Excel par une gestion 100% cloud et sécurisée.",
  },
  {
    title: "Encaissement Automatique",
    description:
      "Passez de la collecte manuelle aux paiements automatiques via Wave et Orange Money.",
  },
  {
    title: "Sérénité Totale",
    description:
      "D'un bureau encombré à un tableau de bord clair qui vous alerte uniquement en cas de besoin.",
  },
];

export default function CompareSection() {
  return (
    <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-black">
      {/* Effets de fond */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.03)_0%,_transparent_70%)]" />
        <div className="absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-[#F4C430]/10 blur-[100px]" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-[#F4C430]/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* En-tête centré */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <span className="inline-block text-[#F4C430] text-sm font-medium tracking-widest uppercase mb-2">
            Comparaison
          </span>
          <h2 className="text-[clamp(1.875rem,4.5vw,3rem)] font-bold tracking-tight text-white">
            La Révolution{" "}
            <span className="gradient-text-animated">Avant / Après</span>
          </h2>
          <div className="gold-divider w-24 mx-auto my-4" />
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Voyez comment{" "}
            <span className="text-[#F4C430] font-medium">Dousell Immo</span>{" "}
            transforme la gestion locative chaotique en une expérience fluide et
            automatisée.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Texte et Features (Gauche sur desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 space-y-8 order-2 lg:order-1"
          >
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="luxury-card rounded-xl p-6"
                >
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#F4C430]" />
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 leading-relaxed pl-5">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Comparateur Image (Droite sur desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 order-1 lg:order-2"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#F4C430]/20">
              <AceCompare
                firstImage="https://res.cloudinary.com/dkkirzpxe/image/upload/doussel/static/comparison/compare2.webp"
                secondImage="https://res.cloudinary.com/dkkirzpxe/image/upload/doussel/static/comparison/compare1.webp"
                className="aspect-[4/3] w-full"
                slideMode="drag"
                showHandlebar={true}
                autoplay={true}
                autoplayDuration={4000}
              />

              {/* Badges Avant / Après */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold pointer-events-none z-50 border border-white/10">
                AVANT
              </div>
              <div className="absolute top-4 right-4 bg-[#F4C430] text-black px-4 py-1.5 rounded-full text-xs font-bold pointer-events-none z-50">
                APRÈS
              </div>

              <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-50">
                <span className="text-xs text-white/80 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                  ← Glissez pour voir la transformation →
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
