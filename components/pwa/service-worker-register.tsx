"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Désactivé temporairement à la demande de l'utilisateur
    /*
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("Service Worker (Killer) enregistré :", registration.scope);
        registration.update();
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement du Service Worker :", error);
      });
    */
  }, []);

  return null;
}

