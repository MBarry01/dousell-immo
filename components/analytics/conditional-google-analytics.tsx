"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { GoogleConsentMode } from "./google-consent-mode";
import { UpdateConsentOnLoad } from "./update-consent-on-load";

interface ConditionalGoogleAnalyticsProps {
  gaId: string;
}

/**
 * Construit les paramètres GA Consent Mode v2 à partir des préférences granulaires.
 * Dupliqué ici pour éviter un import côté client supplémentaire.
 */
function buildConsentParams(prefs: { marketing: boolean; analytics: boolean }) {
  const g = "granted" as const;
  const d = "denied" as const;
  return {
    analytics_storage: prefs.analytics ? g : d,
    ad_storage: prefs.marketing ? g : d,
    ad_user_data: prefs.marketing ? g : d,
    ad_personalization: prefs.marketing ? g : d,
    personalization_storage: prefs.marketing ? g : d,
    functionality_storage: g,
  };
}

/**
 * Charge Google Analytics avec Consent Mode v2.
 * Respecte les préférences granulaires (analytics/marketing) de l'utilisateur.
 */
export function ConditionalGoogleAnalytics({ gaId }: ConditionalGoogleAnalyticsProps) {
  const { preferences, isLoading, hasAnswered } = useCookieConsent();

  useEffect(() => {
    if (isLoading || !hasAnswered || typeof window === "undefined") return;

    const consentParams = buildConsentParams(preferences);

    const updateConsent = () => {
      const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
      if (!dataLayer || !Array.isArray(dataLayer)) return false;
      try {
        dataLayer.push(["consent", "update", consentParams]);
        if (typeof (window as unknown as { gtag?: unknown }).gtag === "function") {
          const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
          gtag("consent", "update", consentParams);
        }
        return true;
      } catch (error) {
        console.error("Erreur lors de la mise à jour du consentement:", error);
        return false;
      }
    };

    const attemptUpdate = (delay: number, retries = 0) => {
      const timeout = setTimeout(() => {
        if (updateConsent()) return;
        if (retries < 5) attemptUpdate(200, retries + 1);
      }, delay);
      return timeout;
    };

    const timeout = attemptUpdate(600);
    return () => clearTimeout(timeout);
  }, [preferences, isLoading, hasAnswered]);

  return (
    <>
      <GoogleConsentMode />
      <UpdateConsentOnLoad />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}
