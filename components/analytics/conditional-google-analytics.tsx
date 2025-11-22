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
 * Composant qui charge Google Analytics avec Consent Mode v2
 * 
 * Conformité EEE (Espace économique européen) :
 * - Google Analytics est toujours chargé (pour les données modélisées)
 * - Le Consent Mode désactive les cookies par défaut
 * - Les cookies ne sont activés que si l'utilisateur accepte
 * 
 * Avantages :
 * - Données modélisées même sans consentement
 * - Conformité RGPD/EEE
 * - Meilleure précision après consentement
 */
export function ConditionalGoogleAnalytics({
  gaId,
}: ConditionalGoogleAnalyticsProps) {
  const { consent, isLoading } = useCookieConsent();

  // Mettre à jour le consentement Google Analytics quand l'utilisateur fait un choix
  // ou quand le composant se monte avec un consentement déjà existant
  useEffect(() => {
    if (isLoading || typeof window === "undefined") return;
    if (!consent) return; // Pas de consentement à mettre à jour

    const consentParams =
      consent === "granted"
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
    // Utilise dataLayer.push directement (plus fiable que gtag qui peut ne pas être encore chargé)
    const updateConsent = () => {
      // Vérifier que dataLayer existe
      const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
      if (!dataLayer || !Array.isArray(dataLayer)) {
        return false;
      }

      try {
        // Utiliser dataLayer.push directement (compatible avec gtag.js)
        // Format: dataLayer.push(['consent', 'update', {...}])
        dataLayer.push(["consent", "update", consentParams]);

        // Si gtag existe, on peut aussi l'utiliser (double sécurité)
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

    // Attendre au moins 600ms pour respecter le wait_for_update du consent par défaut (500ms)
    // Puis essayer plusieurs fois avec des délais progressifs
    const attemptUpdate = (delay: number, retries: number = 0) => {
      const timeout = setTimeout(() => {
        if (updateConsent()) {
          // Succès, on arrête
          return;
        }

        // Si on a encore des tentatives, réessayer
        if (retries < 5) {
          attemptUpdate(200, retries + 1);
        }
      }, delay);

      return timeout;
    };

    // Première tentative après 600ms, puis toutes les 200ms jusqu'à 5 tentatives max
    const timeout = attemptUpdate(600);

    return () => {
      clearTimeout(timeout);
    };
  }, [consent, isLoading]);

  // Toujours charger Google Analytics avec Consent Mode
  // Le Consent Mode s'occupe de désactiver les cookies si nécessaire
  // 
  // IMPORTANT: GoogleConsentMode doit être chargé EN PREMIER
  // pour que le consentement par défaut soit défini avant gtag.js
  return (
    <>
      {/* Consent Mode chargé en premier (useEffect s'exécute avant le render du script) */}
      <GoogleConsentMode />
      {/* Mise à jour du consentement au chargement si existant dans localStorage */}
      <UpdateConsentOnLoad />
      {/* Google Analytics standard injecté dans le head pour détection par Google */}
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
