"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function HeroIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center py-8">
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.12)_0%,_transparent_70%)]" />

      {/* Main container */}
      <div className="relative w-[340px] h-[520px] lg:w-[400px] lg:h-[580px]">

        {/* iPhone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -10 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ perspective: "1000px" }}
        >
          {/* Phone frame */}
          <div className="relative w-[220px] h-[450px] lg:w-[260px] lg:h-[530px]">
            {/* Outer bezel - dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black rounded-[40px] lg:rounded-[48px] shadow-2xl shadow-black/60" />

            {/* Inner bezel highlight */}
            <div className="absolute inset-[3px] bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-[38px] lg:rounded-[46px]" />

            {/* Screen container */}
            <div className="absolute inset-[6px] bg-black rounded-[35px] lg:rounded-[43px] overflow-hidden">
              {/* Dynamic Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 lg:w-28 h-7 lg:h-8 bg-black rounded-full z-20 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              </div>

              {/* Screen Content - Tenant Dashboard */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black pt-14 px-3 lg:px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] lg:text-xs text-white/50">Bonjour,</p>
                    <p className="text-sm lg:text-base text-white font-semibold">Aminata D.</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[#F4C430] to-[#E5B82A] flex items-center justify-center text-black font-bold text-xs lg:text-sm">
                    AD
                  </div>
                </div>

                {/* Success Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-3 lg:p-4 mb-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-emerald-400 text-xs lg:text-sm font-semibold">Paiement réussi</span>
                  </div>
                  <p className="text-white text-lg lg:text-xl font-bold">350 000 FCFA</p>
                  <p className="text-white/50 text-[10px] lg:text-xs">Loyer Janvier 2026 • via Wave</p>
                </motion.div>

                {/* Property Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 lg:p-3 mb-3">
                  <div className="flex gap-2.5">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex-shrink-0 overflow-hidden relative">
                      {/* Mini house illustration */}
                      <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 40 40" fill="none">
                        <rect x="8" y="18" width="24" height="18" rx="1" fill="#F4C430" fillOpacity="0.2" stroke="#F4C430" strokeWidth="1" strokeOpacity="0.5" />
                        <path d="M5 19 L20 6 L35 19" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="16" y="26" width="8" height="10" rx="0.5" fill="#F4C430" fillOpacity="0.3" />
                        <rect x="10" y="22" width="5" height="5" rx="0.5" fill="#F4C430" fillOpacity="0.25" />
                        <rect x="25" y="22" width="5" height="5" rx="0.5" fill="#F4C430" fillOpacity="0.25" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs lg:text-sm font-medium truncate">Appart. Mermoz</p>
                      <p className="text-white/40 text-[9px] lg:text-[10px]">3 pièces • 85 m²</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[#F4C430] text-[10px] lg:text-xs font-semibold">350K</span>
                        <span className="text-white/30 text-[8px] lg:text-[9px]">FCFA/mois</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <div className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 rounded-lg bg-[#F4C430]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-white/60 text-[8px] lg:text-[9px]">Documents</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <div className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 rounded-lg bg-[#F4C430]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white/60 text-[8px] lg:text-[9px]">Historique</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 text-center">
                    <div className="w-6 h-6 lg:w-7 lg:h-7 mx-auto mb-1 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-white/60 text-[8px] lg:text-[9px]">Support</p>
                  </div>
                </div>

                {/* Bottom nav bar hint */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 lg:w-32 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Side buttons */}
            <div className="absolute -left-[2px] top-24 w-[3px] h-8 bg-zinc-700 rounded-l-sm" />
            <div className="absolute -left-[2px] top-36 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
            <div className="absolute -left-[2px] top-52 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
            <div className="absolute -right-[2px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />

            {/* Phone glow effect */}
            <div className="absolute -inset-4 bg-[#F4C430]/10 rounded-[60px] blur-2xl -z-10" />
          </div>
        </motion.div>

        {/* Floating Elements */}

        {/* Wave Logo - Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -30, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute top-8 -left-4 lg:top-12 lg:-left-8 z-20"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-lg shadow-[#1DC3E4]/20"
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/wave.png"
                alt="Wave"
                width={44}
                height={44}
                className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl object-contain"
              />
              <div className="hidden lg:block pr-1">
                <p className="text-white font-semibold text-sm">Wave</p>
                <p className="text-[#1DC3E4] text-[10px]">Paiement mobile</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Orange Money - Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 30, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute top-16 -right-2 lg:top-20 lg:-right-6 z-20"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-lg shadow-orange-500/20"
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/om.png"
                alt="Orange Money"
                width={44}
                height={44}
                className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl object-contain"
              />
              <div className="hidden lg:block pr-1">
                <p className="text-white font-semibold text-sm">Orange Money</p>
                <p className="text-orange-400 text-[10px]">Transfert instantané</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CB Card - Left Middle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="absolute top-1/2 -left-6 lg:-left-12 -translate-y-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/images/CB.png"
                alt="Carte Bancaire"
                width={40}
                height={40}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg object-contain"
              />
              <div className="hidden lg:block pr-1">
                <p className="text-white font-semibold text-xs">Carte</p>
                <p className="text-blue-400 text-[10px]">Visa / MC</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Location Pin - Bottom Left */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="absolute bottom-24 -left-4 lg:bottom-28 lg:-left-8 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-[#F4C430]/20 rounded-2xl p-3 lg:p-4 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-[#F4C430]/20 flex items-center justify-center">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-xs font-medium">Dakar</p>
                <p className="text-white/40 text-[10px]">Almadies, Mermoz...</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Verified Check - Bottom Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="absolute bottom-32 -right-2 lg:bottom-36 lg:-right-6 z-20"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="hidden lg:block">
                <p className="text-emerald-400 text-xs font-semibold">Vérifié</p>
                <p className="text-white/40 text-[10px]">100% sécurisé</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Badge - Bottom Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border border-[#F4C430]/20 rounded-full px-5 py-2.5 shadow-lg flex items-center gap-4">
            <div className="text-center">
              <p className="text-[#F4C430] text-sm font-bold">500+</p>
              <p className="text-white/40 text-[9px]">Biens</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-white text-sm font-bold">24h</p>
              <p className="text-white/40 text-[9px]">Réponse</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-emerald-400 text-sm font-bold">98%</p>
              <p className="text-white/40 text-[9px]">Satisfaits</p>
            </div>
          </div>
        </motion.div>

        {/* Decorative glow elements */}
        <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#F4C430]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-8 w-28 h-28 bg-[#1DC3E4]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
