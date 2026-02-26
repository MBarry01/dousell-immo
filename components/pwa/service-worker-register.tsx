"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Le but est d'installer le Service Worker "Tueur" (Killer SW) 
    // qui va vider le cache et forcer le client à se rafraîchir.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("Service Worker (Killer) enregistré :", registration.scope);
        registration.update(); // Force la récupération de la version tueuse
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement du Service Worker :", error);
      });
  }, []);

  return null;
}

