"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Le but est de DÉTRUIRE l'ancien Service Worker défectueux qui bloque le CSS sur mobile
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregisterPromises = registrations.map((registration) => {
        console.log("Désinscription du Service Worker détectée :", registration.scope);
        return registration.unregister();
      });

      if (unregisterPromises.length > 0) {
        Promise.all(unregisterPromises).then(() => {
          // Utiliser un flag sessionStorage pour ne recharger qu'une seule fois
          // afin d'éviter une boucle infinie de rechargement.
          if (!sessionStorage.getItem("sw-cleared-reload")) {
            console.log("Tous les Service Workers ont été purgés. Rechargement forcé du CSS...");
            sessionStorage.setItem("sw-cleared-reload", "true");
            window.location.reload();
          }
        });
      }
    });
  }, []);

  return null;
}

