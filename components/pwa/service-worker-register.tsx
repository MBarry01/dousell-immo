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

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
      })
      .then((registration) => {
        console.log("Service Worker registered:", registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });

    // Handle service worker updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  return null;
}

