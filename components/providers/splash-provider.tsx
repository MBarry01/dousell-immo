"use client";

import { useState, useEffect, useCallback } from "react";
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
 * SplashProvider - Gère l'affichage du splash screen au chargement
 * 
 * Fonctionnalités :
 * - Affiche le splash au premier chargement (ou à chaque visite si configuré)
 * - Bloque le scroll pendant l'animation
 * - Transition fluide avec AnimatePresence
 * - Stocke en sessionStorage pour ne pas re-afficher lors de la navigation
 */
export const SplashProvider = ({
  children,
  showEveryVisit = false,
  duration = SPLASH_DURATION,
}: SplashProviderProps) => {
  const [showSplash, setShowSplash] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Vérifier si on doit afficher le splash (côté client uniquement)
  useEffect(() => {
    setIsClient(true);
    
    // Vérifier sessionStorage pour éviter de re-montrer le splash
    if (!showEveryVisit) {
      const hasShown = sessionStorage.getItem(SESSION_KEY);
      if (hasShown) {
        setShowSplash(false);
        return;
      }
    }

    // Bloquer le scroll pendant le splash
    document.body.style.overflow = "hidden";
    
    // Timer pour masquer le splash
    const timer = setTimeout(() => {
      setShowSplash(false);
      document.body.style.overflow = "unset";
      
      // Marquer comme affiché pour cette session
      if (!showEveryVisit) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }, duration);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, [duration, showEveryVisit]);

  // Callback quand l'animation de sortie est terminée
  const handleAnimationComplete = useCallback(() => {
    // Animation de sortie terminée - le splash est complètement parti
  }, []);

  // Éviter le flash de contenu avant hydratation
  if (!isClient) {
    return (
      <>
        {/* Placeholder noir pendant l'hydratation SSR */}
        <div className="fixed inset-0 z-50 bg-black" />
        {children}
      </>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="splash"
            onAnimationComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>
      
      {/* Contenu principal avec fade in subtil */}
      <div
        className={`transition-opacity duration-500 ${
          showSplash ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
};

export default SplashProvider;

