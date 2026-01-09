"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F4C430]/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 md:p-12 lg:p-16 text-center backdrop-blur-md"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full mb-6"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <span className="text-[#F4C430] text-sm font-medium">
              ✨ Offre de lancement limitée
            </span>
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Prêt à transformer votre{" "}
            <span className="bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
              gestion immobilière ?
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de propriétaires satisfaits au Sénégal. Essai gratuit de 14
            jours sans engagement.
          </p>

          {/* Benefits List */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {[
              "14 jours d'essai gratuit",
              "Aucune carte requise",
              "Annulation à tout moment",
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <CheckCircle2 className="h-5 w-5 text-[#F4C430]" />
                <span className="text-sm">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#F4C430] text-black font-semibold rounded-full hover:bg-[#FFD700] transition-all shadow-[0_0_40px_rgba(244,196,48,0.4)]"
              >
                <span>Démarrer gratuitement</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
              >
                Parler à un expert
              </Link>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-4">Ils nous font confiance :</p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="text-gray-500 font-semibold">2000+ Utilisateurs</div>
              <div className="text-gray-500">•</div>
              <div className="text-gray-500 font-semibold">8000+ Biens gérés</div>
              <div className="text-gray-500">•</div>
              <div className="text-gray-500 font-semibold">4.9/5 Satisfaction</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
