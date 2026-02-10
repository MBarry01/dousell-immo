"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker in production or if explicitly enabled
    const shouldRegister = 
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_SW === "true";

    if (!shouldRegister) {
      return;
    }

    let updateInterval: number | undefined;
    let registrationRef: ServiceWorkerRegistration | null = null;

    const triggerUpdate = (registration: ServiceWorkerRegistration) => {
      // Si une nouvelle version est déjà en attente, on force l'activation
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      }
      registration.update().catch(() => undefined);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!registrationRef) return;
      triggerUpdate(registrationRef);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
      })
      .then((registration) => {
        registrationRef = registration;

        // Forcer une vérification immédiate (utile en PWA installée)
        triggerUpdate(registration);

        // When a new SW is found, try to activate it ASAP
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // Quand le SW est installé, il peut être en "waiting"
            if (installing.state === "installed" && registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Check for updates periodically (1 minute)
        updateInterval = window.setInterval(() => {
          triggerUpdate(registration);
        }, 60000);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });

    // Handle service worker updates
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      if (updateInterval) {
        window.clearInterval(updateInterval);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}

