"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Hook pour détecter la position de scroll avec throttling pour optimiser les performances
 * @returns La position Y actuelle du scroll
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Fonction pour mettre à jour la position avec throttling
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Initialiser avec la position actuelle
    setScrollY(window.scrollY);

    // Écouter les événements de scroll avec passive pour optimiser
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollY;
}

