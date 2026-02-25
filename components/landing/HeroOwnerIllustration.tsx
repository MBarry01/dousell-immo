"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import { useState, useEffect } from "react";

export default function HeroOwnerIllustration() {
  const [showNotification, setShowNotification] = useState(false);

  // Afficher la notification après un délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 2000);

    // Loop: masquer puis réafficher la notification
    const loopTimer = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => setShowNotification(true), 800);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearInterval(loopTimer);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center py-8">
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(244,196,48,0.15)_0%,_transparent_70%)]" />

      {/* Main container - Adjusted for better responsiveness on mid-size screens */}
      <div className="relative w-full max-w-[380px] h-[500px] lg:max-w-[440px] xl:max-w-[520px] lg:h-[560px]">

        {/* Main Financial Card - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-12 left-1/2 -translate-x-1/2 w-[90%] md:w-[110%] lg:w-[120%] z-10"
        >
          <div className="relative rounded-[28px] overflow-hidden border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <CldImageSafe
              src="https://res.cloudinary.com/dkkirzpxe/image/upload/v1772041036/tab-dash_hlbyt9.png"
              alt="Tableau de bord Revenus"
              width={580}
              height={387}
              className="w-full h-auto object-cover"
              priority
            />

            {/* Glow overlay for better integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        </motion.div>



        {/* Decorative glow elements */}
        <div className="absolute top-1/4 -right-8 w-32 h-32 bg-[#F4C430]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-8 w-28 h-28 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#F4C430]/5 rounded-full blur-3xl" />

        {/* Floating Notification - Pop animation */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-4 -right-2 lg:-right-8 z-30"
            >
              <div className="bg-zinc-900/95 backdrop-blur-xl border border-[#F4C430]/30 rounded-2xl p-3 lg:p-4 shadow-[0_10px_40px_rgba(244,196,48,0.2)] max-w-[260px] lg:max-w-[280px]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[#F4C430]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-base lg:text-lg">🔔</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs lg:text-sm font-medium leading-tight">Loyer de Sidy Dia reçu</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CldImageSafe
                        src="/images/wave.png"
                        alt="Wave"
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-emerald-400 text-xs lg:text-sm font-bold">+250.000 F</span>
                    </div>
                    <p className="text-white/30 text-[10px] mt-1">Il y a 2 min</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Property Count - Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="absolute top-1/2 -left-4 lg:-left-8 -translate-y-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 lg:p-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[#F4C430]/15 flex items-center justify-center">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-[#F4C430] text-xl lg:text-2xl font-bold">8</p>
                <p className="text-white/40 text-[10px] lg:text-xs">Biens gérés</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Occupancy Rate - Bottom Left */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="absolute bottom-6 -left-2 lg:top-8 lg:-left-6 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-3 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 lg:w-12 lg:h-12">
                {/* Circular progress */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="94.2"
                    strokeDashoffset="0"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-emerald-400 text-[10px] lg:text-xs font-bold">100%</span>
              </div>
              <div>
                <p className="text-white text-xs lg:text-sm font-medium">Occupation</p>
                <p className="text-emerald-400 text-[10px]">Tous loués</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Auto-generation Badge - Moved to Left side to avoid covering person */}
        <motion.div
          initial={{ opacity: 0, x: -30 }} // Changed direction
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="absolute bottom-32 -left-8 lg:bottom-40 lg:left-8 z-20"
        >
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-[#F4C430]/20 rounded-2xl p-3 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#F4C430]/15 flex items-center justify-center">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-[#F4C430]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-xs font-medium">Quittances auto</p>
                <p className="text-[#F4C430] text-[10px]">Générées ce mois</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Badge - Bottom Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2 }}
          className="absolute bottom-20 -right-6 lg:bottom-20 lg:-right-13 z-20"
        >
          <div className="bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border border-[#F4C430]/20 rounded-full px-5 py-2.5 shadow-lg flex items-center gap-4">
            <div className="text-center">
              <p className="text-[#F4C430] text-sm font-bold">41.4M</p>
              <p className="text-white/40 text-[9px]">Revenus/an</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-white text-sm font-bold">0</p>
              <p className="text-white/40 text-[9px]">Impayés</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-emerald-400 text-sm font-bold">+15%</p>
              <p className="text-white/40 text-[9px]">vs 2025</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
