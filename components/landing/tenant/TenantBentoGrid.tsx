"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Smartphone, FileText, MessageCircle, Zap, Bell, Shield } from "lucide-react";

export default function TenantBentoGrid() {
  return (
    <section className="relative py-24 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.06)_0%,_transparent_60%)]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[#F4C430] text-sm font-medium tracking-widest uppercase">
              Espace Locataire
            </span>
          </div>

          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] text-white mb-4">
            Tout votre logement{" "}
            <span className="gradient-text-animated">dans votre poche</span>
          </h2>

          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            Gérez votre location depuis votre téléphone. Simple, rapide, moderne.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">

          {/* Bloc Paiement - Large (spans 2 columns on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 group"
          >
            <div className="relative h-full min-h-[320px] rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 p-6 lg:p-8 overflow-hidden transition-all duration-500 hover:border-[#F4C430]/30">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4C430]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 h-full">
                {/* Text content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#F4C430]" fill="#F4C430" />
                    <span className="text-[#F4C430] text-sm font-semibold tracking-wide uppercase">Paiement Express</span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    Payez votre loyer en 1 clic
                  </h3>

                  <p className="text-gray-400 text-base lg:text-lg mb-6">
                    Sans frais cachés. Wave, Orange Money ou carte bancaire — vous choisissez.
                  </p>

                  {/* Payment logos */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                      <Image
                        src="/images/wave.png"
                        alt="Wave"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                      <span className="text-white text-sm font-medium">Wave</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                      <Image
                        src="/images/om.png"
                        alt="Orange Money"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                      <span className="text-white text-sm font-medium">OM</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                      <Image
                        src="/images/CB.png"
                        alt="Carte Bancaire"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                      <span className="text-white text-sm font-medium">CB</span>
                    </div>
                  </div>
                </div>

                {/* Phone mockup */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    {/* Phone frame */}
                    <div className="relative w-44 lg:w-52 h-80 lg:h-96 bg-zinc-800 rounded-[2.5rem] p-2 shadow-2xl shadow-black/50 border border-zinc-700">
                      {/* Notch */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-900 rounded-full z-20" />

                      {/* Screen */}
                      <div className="relative w-full h-full bg-zinc-900 rounded-[2rem] overflow-hidden">
                        {/* Payment success screen */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-900 to-black">
                          {/* Success icon */}
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
                          >
                            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>

                          <p className="text-emerald-400 font-semibold text-sm mb-1">Paiement réussi</p>
                          <p className="text-white font-bold text-xl mb-1">350 000 F</p>
                          <p className="text-gray-500 text-xs">Loyer Janvier 2026</p>

                          {/* Wave logo */}
                          <div className="mt-4 flex items-center gap-2 bg-[#1DC3E4]/10 rounded-full px-3 py-1.5">
                            <Image
                              src="/images/wave.png"
                              alt="Wave"
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded object-contain"
                            />
                            <span className="text-[#1DC3E4] text-xs font-medium">via Wave</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating notification */}
                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                      className="absolute -right-4 top-20 bg-zinc-800 rounded-xl p-3 border border-white/10 shadow-xl"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">Loyer reçu</p>
                          <p className="text-gray-500 text-[10px]">Il y a 2 min</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bloc Administratif */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group"
          >
            <div className="relative h-full min-h-[320px] rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 p-6 overflow-hidden transition-all duration-500 hover:border-blue-500/30">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-sm font-semibold tracking-wide uppercase">Documents</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  Quittances automatiques
                </h3>

                <p className="text-gray-400 text-sm mb-6 flex-grow">
                  Vos quittances envoyées automatiquement chaque mois. Archivage sécurisé.
                </p>

                {/* Document visual */}
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    {/* Stacked documents */}
                    <div className="absolute top-2 left-2 w-full h-24 bg-zinc-800/50 rounded-xl border border-white/5" />
                    <div className="absolute top-1 left-1 w-full h-24 bg-zinc-800/70 rounded-xl border border-white/5" />

                    {/* Main document */}
                    <div className="relative bg-zinc-800 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">Quittance_Janvier_2026.pdf</p>
                          <p className="text-gray-500 text-xs">Envoyée le 05/01/2026</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bloc Support */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group"
          >
            <div className="relative h-full min-h-[320px] rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 p-6 overflow-hidden transition-all duration-500 hover:border-orange-500/30">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-sm font-semibold tracking-wide uppercase">Support</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  Signalement en direct
                </h3>

                <p className="text-gray-400 text-sm mb-6 flex-grow">
                  Un problème de plomberie ? Signalez-le en direct au propriétaire.
                </p>

                {/* Chat visual */}
                <div className="space-y-3">
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-end"
                  >
                    <div className="bg-[#F4C430] rounded-2xl rounded-br-md px-4 py-2 max-w-[85%]">
                      <p className="text-black text-sm">Fuite d&apos;eau dans la salle de bain</p>
                    </div>
                  </motion.div>

                  {/* Owner response */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-start"
                  >
                    <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-[85%] border border-white/5">
                      <p className="text-white text-sm">J&apos;envoie un plombier demain matin</p>
                    </div>
                  </motion.div>

                  {/* Typing indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-1.5 px-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs">🏠</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bloc Sécurité - Small */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group"
          >
            <div className="relative h-full min-h-[180px] rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-white/5 p-6 overflow-hidden transition-all duration-500 hover:border-[#F4C430]/30">
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F4C430]/10 flex items-center justify-center flex-shrink-0 border border-[#F4C430]/20">
                  <Shield className="w-7 h-7 text-[#F4C430]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Données sécurisées</h3>
                  <p className="text-gray-400 text-sm">Vos informations sont chiffrées et protégées.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
