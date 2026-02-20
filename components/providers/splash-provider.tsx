"use client";

import { useState, useEffect } from "react";
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
 * Détecte si l'app tourne en mode PWA standalone
 * (installée sur l'écran d'accueil)
 */
const checkIsPWA = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

/**
 * SplashProvider - Gère l'affichage du splash screen au chargement
 * 
 * En mode navigateur classique : le splash est totalement désactivé.
 * En mode PWA (app installée) : le splash s'affiche une fois par session.
 */
export const SplashProvider = ({
  children,
  showEveryVisit = false,
  duration = MIN_SPLASH_DURATION,
}: SplashProviderProps) => {
  const { loading: authLoading } = useAuth();
  // Commencer avec splash désactivé → pas de flash en mode navigateur
  const [showSplash, setShowSplash] = useState(false);
  const [isPWASplashActive, setIsPWASplashActive] = useState(false);
  const [minDurationPassed, setMinDurationPassed] = useState(false);

  useEffect(() => {
    const isPWA = checkIsPWA();

    // Navigateur classique → rien à faire, children rendus normalement
    if (!isPWA) {
      removeSplashBlocker();
      return;
    }

    // PWA: vérifier si déjà montré cette session
    if (!showEveryVisit) {
      const hasShown = sessionStorage.getItem(SESSION_KEY);
      if (hasShown) {
        removeSplashBlocker();
        return;
      }
    }

    // PWA + première visite → activer le splash
    setTimeout(() => {
      setShowSplash(true);
      setIsPWASplashActive(true);
    }, 0);
    document.body.style.overflow = "hidden";

    // Timer pour la durée minimale (effet visuel)
    const minTimer = setTimeout(() => {
      setMinDurationPassed(true);
    }, duration);

    // Sécurité (Max Timeout) pour éviter de bloquer sur une erreur auth
    const maxTimer = setTimeout(() => {
      setMinDurationPassed(true);
    }, MAX_SPLASH_TIMEOUT);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      document.body.style.overflow = "";
    };
  }, [duration, showEveryVisit]);

  // Sortie du splash synchronisée (PWA uniquement)
  useEffect(() => {
    if (isPWASplashActive && !authLoading && minDurationPassed) {
      setTimeout(() => {
        setShowSplash(false);
        setIsPWASplashActive(false);
      }, 0);
      removeSplashBlocker();
      document.body.style.overflow = "";

      if (!showEveryVisit) {
        sessionStorage.setItem(SESSION_KEY, "true");
      }
    }
  }, [isPWASplashActive, authLoading, minDurationPassed, showEveryVisit]);

  // Fallback de sécurité absolu (PWA uniquement)
  useEffect(() => {
    if (!isPWASplashActive) return;

    const forceExitTimer = setTimeout(() => {
      if (showSplash) {
        console.warn("[SplashProvider] Force exit après timeout de sécurité");
        setShowSplash(false);
        setIsPWASplashActive(false);
        removeSplashBlocker();
        document.body.style.overflow = "";
        if (!showEveryVisit) {
          sessionStorage.setItem(SESSION_KEY, "true");
        }
      }
    }, MAX_SPLASH_TIMEOUT + 1000);

    return () => clearTimeout(forceExitTimer);
  }, [showSplash, isPWASplashActive, showEveryVisit]);

  // Rendu unifié pour éviter l'unmount/remount des children (source de boucles infinies)
  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash-screen" />}
      </AnimatePresence>

      <div
        key="main-content"
        className="will-change-[opacity]"
        style={{
          opacity: showSplash ? 0 : 1,
          pointerEvents: showSplash ? "none" : "auto",
          transition: "opacity 1s cubic-bezier(0.22, 1, 0.36, 1)",
          visibility: showSplash ? "hidden" : "visible",
          backgroundColor: "#05080c",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default SplashProvider;
