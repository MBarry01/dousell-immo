"use client";

import { useState, useEffect, useCallback } from "react";

export type CookieConsentStatus = "granted" | "denied" | null;

export type CookiePreferences = {
  marketing: boolean;
  analytics: boolean;
};

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFS_KEY = "cookie-preferences";

const DEFAULT_PREFS_GRANTED: CookiePreferences = { marketing: true, analytics: true };
const DEFAULT_PREFS_DENIED: CookiePreferences = { marketing: false, analytics: false };

/**
 * Lit les préférences granulaires depuis localStorage.
 * Rétrocompatible : "granted" legacy → toutes prefs à true, "denied" → toutes à false.
 */
export function readStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(COOKIE_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CookiePreferences;
      if (typeof parsed.marketing === "boolean" && typeof parsed.analytics === "boolean") {
        return parsed;
      }
    }
    // Rétrocompatibilité : pas de prefs key → lire le consentement global
    const legacy = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (legacy === "granted") return DEFAULT_PREFS_GRANTED;
    if (legacy === "denied") return DEFAULT_PREFS_DENIED;
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook pour gérer le consentement aux cookies.
 * Stocke le choix dans localStorage (cookie-consent + cookie-preferences).
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentStatus>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFS_DENIED);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored === "granted" || stored === "denied") {
        setConsent(stored);
        const prefs = readStoredPreferences();
        if (prefs) setPreferences(prefs);
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du consentement:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Accepte tous les cookies */
  const grantConsent = useCallback(() => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "granted");
      localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(DEFAULT_PREFS_GRANTED));
      setConsent("granted");
      setPreferences(DEFAULT_PREFS_GRANTED);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du consentement:", error);
    }
  }, []);

  /** Accepte uniquement les cookies nécessaires */
  const denyConsent = useCallback(() => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "denied");
      localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(DEFAULT_PREFS_DENIED));
      setConsent("denied");
      setPreferences(DEFAULT_PREFS_DENIED);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du refus:", error);
    }
  }, []);

  /** Accepte une sélection personnalisée */
  const grantCustomConsent = useCallback((prefs: CookiePreferences) => {
    try {
      // Si aucun cookie optionnel accepté → "denied", sinon "granted"
      const status: CookieConsentStatus =
        prefs.marketing || prefs.analytics ? "granted" : "denied";
      localStorage.setItem(COOKIE_CONSENT_KEY, status);
      localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
      setConsent(status);
      setPreferences(prefs);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des préférences:", error);
    }
  }, []);

  return {
    consent,
    preferences,
    isLoading,
    hasConsent: consent === "granted",
    hasDenied: consent === "denied",
    hasAnswered: consent !== null,
    grantConsent,
    denyConsent,
    grantCustomConsent,
  };
}
