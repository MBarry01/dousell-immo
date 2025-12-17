"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/ui/splash-screen";

const SPLASH_DURATION = 2500; // ms - durée totale avant fade out
const SESSION_KEY = "doussel_splash_shown";

interface SplashProviderProps {
  children: React.ReactNode;
  /** Si true, affiche le splash à chaque visite (pas seulement la première) */
  showEveryVisit?: boolean;
  /** Durée personnalisée en ms */
  duration?: number;
}

/**
 * Supprime le blocker HTML créé par le script inline
 */
const removeSplashBlocker = () => {
  const blocker = document.getElementById("splash-blocker");
  if (blocker) {
    blocker.remove();
  }
  document.documentElement.style.overflow = "";
};

/**
 * SplashProvider - Gère l'affichage du splash screen au chargement
 * 
 * Structure stable pour éviter les warnings de key dans Next.js App Router
 */
export const SplashProvider = ({
  children,
  showEveryVisit = false,
  duration = SPLASH_DURATION,
}: SplashProviderProps) => {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Vérifier sessionStorage pour éviter de re-montrer le splash
    if (!showEveryVisit) {
      const hasShown = sessionStorage.getItem(SESSION_KEY);
      if (hasShown) {
        removeSplashBlocker();
        setShowSplash(false);
        setIsReady(true);
        return;
      }
    }

    // Supprimer le blocker HTML - React prend le relais
    removeSplashBlocker();
    setIsReady(true);
    
    // Bloquer le scroll pendant le splash
    document.body.style.overflow = "hidden";
    
    // Timer pour masquer le splash
    const timer = setTimeout(() => {
      setShowSplash(false);
      document.body.style.overflow = "";
      
      // Marquer comme affiché pour cette session
      if (!showEveryVisit) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [duration, showEveryVisit]);

  // Structure stable - toujours le même wrapper
  return (
    <>
      {/* Splash Screen avec AnimatePresence */}
      <AnimatePresence mode="wait">
        {showSplash && isReady && <SplashScreen key="splash-screen" />}
      </AnimatePresence>
      
      {/* Contenu principal - toujours rendu mais caché si splash visible */}
      <div
        key="main-content"
        style={{
          opacity: showSplash ? 0 : 1,
          pointerEvents: showSplash ? "none" : "auto",
          transition: "opacity 0.4s ease-out",
        }}
      >
        {children}
      </div>
      
      {/* Écran noir de fallback avant hydratation */}
      {!isReady && (
        <div 
          key="loading-blocker"
          className="fixed inset-0 z-[9999] bg-black" 
        />
      )}
    </>
  );
};

export default SplashProvider;
