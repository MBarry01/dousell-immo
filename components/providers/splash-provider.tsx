"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/ui/splash-screen";

const MIN_SPLASH_DURATION = 1600; // ms - Toujours montrer au moins 1.6s
const MAX_SPLASH_TIMEOUT = 5000; // ms - Sécurité pour ne pas bloquer l'utilisateur
const SESSION_KEY = "doussel_splash_shown";

interface SplashProviderProps {
  children: React.ReactNode | React.ReactNode[];
  /** Si true, affiche le splash à chaque visite (pas seulement la première) */
  showEveryVisit?: boolean;
  /** Durée personnalisée en ms */
  duration?: number;
}

/**
 * Supprime le blocker HTML créé par le script inline dans layout.tsx
 */
const removeSplashBlocker = () => {
  if (typeof document === 'undefined') return;

  const blocker = document.getElementById("splash-blocker");
  if (blocker) {
    blocker.remove();
  }

  const styleBlocker = document.getElementById("splash-style-blocker");
  if (styleBlocker) {
    styleBlocker.remove();
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
  duration = MIN_SPLASH_DURATION,
}: SplashProviderProps) => {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [minDurationPassed, setMinDurationPassed] = useState(false);

  useEffect(() => {
    // 1. Vérifier si le splash est nécessaire
    if (!showEveryVisit && typeof window !== "undefined") {
      const hasShown = sessionStorage.getItem(SESSION_KEY);
      if (hasShown) {
        removeSplashBlocker();
        setShowSplash(false);
        setIsReady(true);
        return;
      }
    }

    setIsReady(true);
    document.body.style.overflow = "hidden";

    // 2. Timer pour la durée minimale (effet visuel)
    const minTimer = setTimeout(() => {
      setMinDurationPassed(true);
    }, duration);

    // 3. Sécurité (Max Timeout) pour éviter de bloquer sur une erreur auth
    const maxTimer = setTimeout(() => {
      setMinDurationPassed(true);
      // On force la fin du splash même si authLoading est encore true
    }, MAX_SPLASH_TIMEOUT);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      document.body.style.overflow = "";
    };
  }, [duration, showEveryVisit]);

  // 4. Sortie du splash synchronisée
  useEffect(() => {
    // On ne sort que si : 
    // - On est déjà prêt (isReady)
    // - ET l'auth a fini de charger (pour éviter les sauts de UI)
    // - ET la durée minimale visuelle est passée
    if (isReady && !authLoading && minDurationPassed) {
      setShowSplash(false);
      removeSplashBlocker();
      document.body.style.overflow = "";

      if (!showEveryVisit) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }
  }, [isReady, authLoading, minDurationPassed, showEveryVisit]);

  // Structure stable - un seul wrapper pour éviter les warnings de key dans Next.js App Router
  return (
    <>
      {/* Splash Screen avec AnimatePresence */}
      {showSplash && isReady && (
        <AnimatePresence mode="wait">
          <SplashScreen key="splash-screen" />
        </AnimatePresence>
      )}

      {/* Contenu principal - propre handover */}
      <div
        key="main-content"
        className="will-change-[opacity]"
        style={{
          opacity: showSplash ? 0 : 1,
          pointerEvents: showSplash ? "none" : "auto",
          transition: "opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          // CLEAN HANDOVER: Ne pas rendre les inputs tant que le splash est là
          // Cela empêche l'autofill de mot de passe de parasiter le splash.
          display: isReady && !showSplash ? "block" : "none",
        }}
      >
        {children}
      </div>

      {/* Écran noir de fallback avant hydratation */}
      {!isReady && (
        <div key="fallback-black" className="fixed inset-0 z-[9999] bg-black" />
      )}
    </>
  );
};

export default SplashProvider;
