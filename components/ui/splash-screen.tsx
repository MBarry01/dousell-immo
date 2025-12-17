"use client";

import { motion } from "framer-motion";

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

/**
 * SplashScreen - Animation de chargement "Construction Blueprint"
 * 
 * Séquence :
 * 1. Le toit se dessine (pathLength animation)
 * 2. Les murs se dessinent
 * 3. Le soleil apparaît avec effet "pop" + onde de choc
 * 4. Fade out du conteneur
 */
export const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  // === CONFIGURATION DES TIMINGS ===
  const ROOF_DURATION = 0.7;
  const WALLS_DELAY = ROOF_DURATION - 0.1;
  const WALLS_DURATION = 0.9;
  const SUN_DELAY = WALLS_DELAY + WALLS_DURATION + 0.1;
  const HOLD_DURATION = 0.6; // Pause après l'animation complète
  const TOTAL_ANIMATION = SUN_DELAY + HOLD_DURATION;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onAnimationComplete={(definition) => {
        // Appelé uniquement lors de l'exit animation
        if (definition === "exit" && onAnimationComplete) {
          onAnimationComplete();
        }
      }}
    >
      {/* Container SVG avec animation scale subtile à la fin */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, 1.02, 1] }}
        transition={{
          duration: TOTAL_ANIMATION + 0.3,
          times: [0, 0.8, 0.9, 1],
          ease: "easeInOut",
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="100 120 312 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
          aria-label="Doussel Immo - Chargement"
        >
          {/* ========== TOIT ========== */}
          <motion.path
            d="M128 304L256 192L384 304"
            stroke="white"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                duration: ROOF_DURATION,
                ease: "easeInOut",
              },
              opacity: {
                duration: 0.1,
              },
            }}
          />

          {/* ========== MURS ========== */}
          <motion.path
            d="M192 288V384H320V288"
            stroke="white"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                delay: WALLS_DELAY,
                duration: WALLS_DURATION,
                ease: "easeInOut",
              },
              opacity: {
                delay: WALLS_DELAY,
                duration: 0.1,
              },
            }}
          />

          {/* ========== ONDE DE CHOC (Shockwave) ========== */}
          <motion.circle
            cx="256"
            cy="160"
            r="40"
            fill="#F2C94C"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.2], opacity: [0.6, 0] }}
            transition={{
              delay: SUN_DELAY,
              duration: 0.5,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "256px 160px" }}
          />

          {/* ========== SOLEIL (Sun Pop) ========== */}
          <motion.circle
            cx="256"
            cy="160"
            r="40"
            fill="#F2C94C"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: SUN_DELAY,
              type: "spring",
              stiffness: 400,
              damping: 12,
            }}
            style={{ transformOrigin: "256px 160px" }}
          />
        </svg>
      </motion.div>

      {/* ========== TEXTE ANIMÉ ========== */}
      <motion.div
        className="mt-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: SUN_DELAY + 0.2, duration: 0.4 }}
      >
        <span className="text-xs font-medium tracking-[0.4em] text-white/50">
          DOUSSEL IMMO
        </span>
        
        {/* Barre de progression subtile */}
        <motion.div
          className="mt-3 h-[2px] w-16 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#F2C94C] to-[#F2C94C]/60"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              delay: 0.3,
              duration: TOTAL_ANIMATION - 0.3,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;

