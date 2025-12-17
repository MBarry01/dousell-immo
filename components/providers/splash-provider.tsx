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
 * IMPORTANT: Le contenu n'est PAS rendu tant que le splash est visible
 * pour éviter tout flash de contenu.
 */
export const SplashProvider = ({
  children,
  showEveryVisit = false,
  duration = SPLASH_DURATION,
}: SplashProviderProps) => {
  // État initial: on ne sait pas encore si on doit montrer le splash
  const [splashState, setSplashState] = useState<"loading" | "showing" | "hidden">("loading");

  useEffect(() => {
    // Vérifier sessionStorage pour éviter de re-montrer le splash
    if (!showEveryVisit) {
      const hasShown = sessionStorage.getItem(SESSION_KEY);
      if (hasShown) {
        // Supprimer le blocker HTML immédiatement
        removeSplashBlocker();
        setSplashState("hidden");
        return;
      }
    }

    // Supprimer le blocker HTML - React prend le relais avec le vrai splash
    removeSplashBlocker();
    
    // Afficher le splash React
    setSplashState("showing");
    
    // Bloquer le scroll pendant le splash
    document.body.style.overflow = "hidden";
    
    // Timer pour masquer le splash
    const timer = setTimeout(() => {
      setSplashState("hidden");
      document.body.style.overflow = "";
      
      // Marquer comme affiché pour cette session
      if (!showEveryVisit) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }, duration);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [duration, showEveryVisit]);

  // État initial (avant useEffect) - écran noir (le blocker HTML est déjà visible)
  if (splashState === "loading") {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  // Splash en cours d'affichage - NE PAS rendre le contenu
  if (splashState === "showing") {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" />
      </AnimatePresence>
    );
  }

  // Splash terminé - afficher le contenu avec fade in
  return (
    <div
      className="animate-fade-in"
      style={{
        animation: "fadeIn 0.4s ease-out forwards",
      }}
    >
      {children}
    </div>
  );
};

export default SplashProvider;
