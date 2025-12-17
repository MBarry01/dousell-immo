"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Composant qui scroll automatiquement vers le haut de la page
 * lors des changements de route
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll vers le haut de la page à chaque changement de route
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Utiliser "instant" pour un scroll immédiat sans animation
    });
  }, [pathname]);

  return null;
}










