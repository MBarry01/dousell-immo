"use client";

import { useEffect } from "react";
import { readStoredPreferences } from "@/hooks/use-cookie-consent";

/**
 * Construit les paramètres GA Consent Mode v2 à partir des préférences granulaires.
 * - analytics → analytics_storage
 * - marketing → ad_storage, ad_user_data, ad_personalization, personalization_storage
 * - functionality_storage toujours granted (cookies nécessaires)
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
 * Met à jour Google Analytics Consent Mode v2 au chargement de la page
 * si un consentement existe déjà dans localStorage.
 */
export function UpdateConsentOnLoad() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefs = readStoredPreferences();
    if (!prefs) return; // Pas encore de choix effectué

    const consentParams = buildConsentParams(prefs);

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
        console.error("Erreur consentement GA:", error);
        return false;
      }
    };

    if (updateConsent()) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (updateConsent() || attempts >= 50) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return null;
}
