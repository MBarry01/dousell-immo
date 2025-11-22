"use client";

import { useEffect } from "react";

/**
 * Initialise le Consent Mode v2 de Google Analytics
 * Ce script doit être chargé AVANT Google Analytics
 * 
 * Selon les recommandations Google pour l'EEE :
 * - Par défaut, les cookies sont refusés (ad_storage, analytics_storage)
 * - Le mode consent permet la collecte de données modélisées même sans cookies
 * - Quand l'utilisateur accepte, on met à jour le consentement
 */
export function GoogleConsentMode() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialiser dataLayer si inexistant (doit être fait en premier)
    const win = window as unknown as { dataLayer?: unknown[] };
    if (!win.dataLayer || !Array.isArray(win.dataLayer)) {
      win.dataLayer = [];
    }

    // Fonction gtag si inexistante
    function gtag(...args: unknown[]) {
      if (!win.dataLayer || !Array.isArray(win.dataLayer)) {
        win.dataLayer = [];
      }
      win.dataLayer.push(args);
    }

    // Définir le consentement par défaut (REFUSÉ) avant le chargement de GA
    // Ceci est conforme aux exigences de l'EEE
    // IMPORTANT: Ceci doit être exécuté AVANT que @next/third-parties charge gtag.js
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted", // Toujours autorisé pour la sécurité
      wait_for_update: 500, // Attendre 500ms avant de mettre à jour (temps pour lire le localStorage)
    });

    // Exposer gtag globalement pour les autres scripts
    // Cela permet à @next/third-parties/google de l'utiliser
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
  }, []); // Exécuté une seule fois au montage, AVANT que Google Analytics ne se charge

  return null;
}
