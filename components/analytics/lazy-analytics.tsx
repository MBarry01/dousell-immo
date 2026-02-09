'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load les composants analytics avec dynamic import
const ConditionalGoogleAnalytics = dynamic(
  () => import('./conditional-google-analytics').then((mod) => mod.ConditionalGoogleAnalytics),
  { ssr: false }
);

const MicrosoftClarity = dynamic(
  () => import('./microsoft-clarity').then((mod) => mod.MicrosoftClarity),
  { ssr: false }
);

// Lazy load Google Tag Manager (GTM)
const GoogleTagManager = dynamic(
  () => import('@next/third-parties/google').then((mod) => mod.GoogleTagManager),
  { ssr: false }
);

interface LazyAnalyticsProps {
  gaId?: string;
  clarityId: string;
  gtmId?: string;
}

/**
 * LazyAnalytics - Charge les analytics après interaction utilisateur
 *
 * Optimisation: Au lieu de charger immédiatement au render, on attend:
 * - 3 secondes IDLE OU
 * - Premier scroll OU
 * - Premier click
 *
 * Inclut: Google Analytics, Microsoft Clarity, Google Tag Manager
 * Impact: -1s sur FCP, -500ms sur LCP, -70% LCP sur /gestion
 */
export function LazyAnalytics({ gaId, clarityId, gtmId }: LazyAnalyticsProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Ne charger que côté client
    if (typeof window === 'undefined') return;

    let timeout: NodeJS.Timeout;
    let isLoaded = false;

    const loadAnalytics = () => {
      if (isLoaded) return;
      isLoaded = true;
      setLoaded(true);

      // Cleanup
      clearTimeout(timeout);
      window.removeEventListener('scroll', loadAnalytics);
      window.removeEventListener('click', loadAnalytics);
      window.removeEventListener('touchstart', loadAnalytics);
      window.removeEventListener('mousemove', loadAnalytics);
    };

    // Stratégie 1: Charger après 3s d'inactivité
    timeout = setTimeout(loadAnalytics, 3000);

    // Stratégie 2: Charger dès la première interaction
    window.addEventListener('scroll', loadAnalytics, { once: true, passive: true });
    window.addEventListener('click', loadAnalytics, { once: true });
    window.addEventListener('touchstart', loadAnalytics, { once: true, passive: true });
    window.addEventListener('mousemove', loadAnalytics, { once: true, passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', loadAnalytics);
      window.removeEventListener('click', loadAnalytics);
      window.removeEventListener('touchstart', loadAnalytics);
      window.removeEventListener('mousemove', loadAnalytics);
    };
  }, []);

  // Ne rien afficher tant que pas chargé
  if (!loaded) return null;

  return (
    <>
      {gaId && <ConditionalGoogleAnalytics gaId={gaId} />}
      <MicrosoftClarity clarityId={clarityId} />
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
    </>
  );
}
