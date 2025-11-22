"use client";

import { useEffect } from "react";

/**
 * Composant qui met à jour le consentement Google Analytics au chargement
 * si un consentement existe déjà dans localStorage.
 * 
 * Ce composant s'exécute de manière indépendante pour garantir la mise à jour
 * même si le timing n'est pas parfait.
 */
export function UpdateConsentOnLoad() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Lire directement depuis localStorage (plus rapide que le hook)
    const storedConsent = localStorage.getItem("cookie-consent");
    if (!storedConsent || (storedConsent !== "granted" && storedConsent !== "denied")) {
      return;
    }

    const consentParams =
      storedConsent === "granted"
        ? {
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
            analytics_storage: "granted",
            functionality_storage: "granted",
            personalization_storage: "granted",
          }
        : {
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            analytics_storage: "denied",
            functionality_storage: "denied",
            personalization_storage: "denied",
          };

    // Fonction pour mettre à jour le consentement
    const updateConsent = () => {
      const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
      if (!dataLayer || !Array.isArray(dataLayer)) {
        return false;
      }

      try {
        // Utiliser dataLayer.push directement
        dataLayer.push(["consent", "update", consentParams]);

        // Si gtag existe, l'utiliser aussi
        if (typeof (window as unknown as { gtag?: unknown }).gtag === "function") {
          const gtag = (window as unknown as { gtag: (...args: unknown[]) => void })
            .gtag;
          gtag("consent", "update", consentParams);
        }

        return true;
      } catch (error) {
        console.error("Erreur lors de la mise à jour du consentement:", error);
        return false;
      }
    };

    // Essayer immédiatement, puis toutes les 200ms jusqu'à 10 secondes
    let attempts = 0;
    const maxAttempts = 50; // 50 tentatives * 200ms = 10 secondes max

    // Première tentative immédiate
    if (updateConsent()) {
      return;
    }

    // Puis essayer toutes les 200ms
    const interval = setInterval(() => {
      attempts++;
      if (updateConsent() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []); // S'exécute une seule fois au montage

  return null;
}

