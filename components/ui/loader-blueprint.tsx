"use client";

import { motion } from "framer-motion";

/**
 * LoaderBlueprint - Animation de chargement "Construction"
 * 
 * Concept : La maison se dessine comme un plan d'architecte,
 * puis le soleil apparaît pour symboliser le foyer terminé.
 */
export const LoaderBlueprint = () => {
  // Configuration des timings
  const ROOF_DURATION = 0.8; // Durée pour dessiner le toit
  const WALLS_DELAY = ROOF_DURATION - 0.1; // Les murs commencent légèrement avant la fin du toit
  const WALLS_DURATION = 1.0; // Durée pour dessiner les murs
  const SUN_DELAY = WALLS_DELAY + WALLS_DURATION + 0.15; // Le soleil apparaît après
  
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
      <svg
        width="150"
        height="150"
        viewBox="100 120 312 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* ============================================
            PARTIE 1 : LE TOIT (Premier tracé)
            ============================================ */}
        <motion.path
          d="M128 304L256 192L384 304"
          stroke="white"
          strokeWidth="20"
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
              duration: 0.15,
            },
          }}
        />

        {/* ============================================
            PARTIE 2 : LES MURS (Second tracé)
            ============================================ */}
        <motion.path
          d="M192 288V384H320V288"
          stroke="white"
          strokeWidth="20"
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
              duration: 0.15,
            },
          }}
        />

        {/* ============================================
            PARTIE 3 : L'ONDE DE CHOC (Cercle qui s'expand)
            ============================================ */}
        <motion.circle
          cx="256"
          cy="160"
          r="40"
          fill="#F2C94C"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2], opacity: [0.5, 0] }}
          transition={{
            delay: SUN_DELAY,
            duration: 0.5,
            ease: "easeOut",
          }}
          style={{ transformOrigin: "256px 160px" }}
        />

        {/* ============================================
            PARTIE 4 : LE SOLEIL (Touche finale avec pop)
            ============================================ */}
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
            stiffness: 350,
            damping: 12,
          }}
          style={{ transformOrigin: "256px 160px" }}
        />
      </svg>

      {/* Texte animé sous le loader */}
      <motion.p
        className="mt-8 text-xs font-medium tracking-[0.4em] text-white/40"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: SUN_DELAY + 0.3, duration: 0.5 }}
      >
        DOUSSEL IMMO
      </motion.p>
    </div>
  );
};

export default LoaderBlueprint;

