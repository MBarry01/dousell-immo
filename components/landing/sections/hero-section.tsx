"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Users, FileText } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-24 md:pt-32 pb-20 relative overflow-hidden bg-black">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#F4C430]/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Subheading Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full">
            <span className="text-[#F4C430] text-sm font-medium">
              🏆 Solution immobilière premium au Sénégal
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Gérez votre{" "}
            <span className="bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
              patrimoine immobilier
            </span>{" "}
            en toute simplicité
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            La plateforme tout-en-un qui révolutionne la gestion immobilière au Sénégal.
            Pilotez vos biens, vos locataires et vos finances depuis une interface intuitive.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#F4C430] text-black font-semibold rounded-full hover:bg-[#FFD700] transition-all shadow-[0_0_30px_rgba(244,196,48,0.3)]"
              >
                <span>Essai gratuit 14 jours</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
              >
                Voir la démo
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-8 md:gap-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-center">
              <div className="text-[clamp(1.875rem,3.5vw,2.25rem)] font-bold text-white mb-1">2K+</div>
              <div className="text-sm text-gray-400">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-[clamp(1.875rem,3.5vw,2.25rem)] font-bold text-white mb-1">8K+</div>
              <div className="text-sm text-gray-400">Biens gérés</div>
            </div>
            <div className="text-center">
              <div className="text-[clamp(1.875rem,3.5vw,2.25rem)] font-bold text-[#F4C430] mb-1">4.9/5</div>
              <div className="text-sm text-gray-400">Satisfaction client</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image/Dashboard Preview */}
        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="relative">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="bg-black/60 rounded-2xl p-6 backdrop-blur-sm">
                {/* Dashboard Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Tableau de bord</h3>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>

                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 p-4 rounded-xl">
                      <Building2 className="h-8 w-8 text-[#F4C430] mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">24</div>
                      <div className="text-sm text-gray-400">Biens actifs</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                      <Users className="h-8 w-8 text-blue-400 mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">87</div>
                      <div className="text-sm text-gray-400">Locataires</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                      <FileText className="h-8 w-8 text-green-400 mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">45M</div>
                      <div className="text-sm text-gray-400">FCFA / mois</div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3 mt-6">
                    <motion.div
                      className="h-2 bg-[#F4C430] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.8, duration: 1 }}
                    />
                    <motion.div
                      className="h-2 bg-[#F4C430]/70 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "80%" }}
                      transition={{ delay: 1, duration: 1 }}
                    />
                    <motion.div
                      className="h-2 bg-[#F4C430]/50 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "60%" }}
                      transition={{ delay: 1.2, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decoration */}
            <div className="absolute -z-10 inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
