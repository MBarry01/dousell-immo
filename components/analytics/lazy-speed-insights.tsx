"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load SpeedInsights de Vercel
const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false }
);

/**
 * LazySpeedInsights - Charge Speed Insights après interaction utilisateur
 *
 * Optimisation: Au lieu de charger immédiatement au render, on attend:
 * - 3 secondes IDLE OU
 * - Premier scroll OU
 * - Premier click
 *
 * Impact: -800ms sur critical path, améliore LCP mobile
 * Référence: PageSpeed Insights montrait 831ms de latency pour speed-insights/vitals
 */
export function LazySpeedInsights() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Ne charger que côté client
    if (typeof window === 'undefined') return;

    let timeout: NodeJS.Timeout;
    let isLoaded = false;

    const load = () => {
      if (isLoaded) return;
      isLoaded = true;
      setLoaded(true);
      cleanup();
    };

    // Trigger 1: Après 3 secondes d'idle
    timeout = setTimeout(load, 3000);

    // Trigger 2: Premier scroll
    const onScroll = () => load();

    // Trigger 3: Premier click
    const onClick = () => load();

    window.addEventListener('scroll', onScroll, { once: true, passive: true });
    window.addEventListener('click', onClick, { once: true, passive: true });

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onClick);
    };

    return cleanup;
  }, []);

  // Ne rien afficher tant que pas chargé
  if (!loaded) return null;

  return <SpeedInsights />;
}
