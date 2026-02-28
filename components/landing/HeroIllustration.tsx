"use client";

import { motion } from "framer-motion";
import { CldImageSafe } from "@/components/ui/CldImageSafe";

export default function HeroIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center py-8">
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.12)_0%,_transparent_70%)]" />

      {/* Main container */}
      <div className="relative w-[340px] h-[520px] lg:w-[400px] lg:h-[580px]">

        {/* Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateY: -10 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ perspective: "1000px" }}
        >
          <div className="relative w-[220px] h-[450px] lg:w-[260px] lg:h-[530px]">
            <CldImageSafe
              src="mocupProLoc_f0pj79"
              alt="Application Dousel Locataire"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
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
          className="absolute top-8 -left-4 lg:top-7 lg:-left-8 z-20"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-lg shadow-[#1DC3E4]/20"
          >
            <div className="flex items-center gap-2.5">
              <CldImageSafe
                src="doussel/static/icons/wave"
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
          className="absolute top-16 -right-2 lg:top-35 lg:-right-6 z-20"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-lg shadow-orange-500/20"
          >
            <div className="flex items-center gap-2.5">
              <CldImageSafe
                src="doussel/static/icons/om"
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
          className="absolute top-1/2 -left-6 lg:-left-7 -translate-y-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 lg:p-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <CldImageSafe
                src="doussel/static/icons/cb"
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

        {/* Stats Badge removed to avoid redundancy with main Hero badges */}

        {/* Decorative glow elements */}
        <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#F4C430]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-8 w-28 h-28 bg-[#1DC3E4]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
