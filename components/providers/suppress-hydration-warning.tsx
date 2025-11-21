"use client";

import { useEffect } from "react";

/**
 * Composant pour supprimer les attributs ajoutés par les extensions de navigateur
 * (comme Grammarly) qui causent des erreurs d'hydratation.
 * 
 * Ces attributs sont ajoutés après le rendu initial et ne peuvent pas être évités.
 * Ce composant nettoie ces attributs après l'hydratation.
 */
export function SuppressHydrationWarning() {
  useEffect(() => {
    // Supprimer les attributs ajoutés par Grammarly après l'hydratation
    const removeGrammarlyAttributes = () => {
      const body = document.body;
      if (body) {
        body.removeAttribute("data-new-gr-c-s-check-loaded");
        body.removeAttribute("data-gr-ext-installed");
      }
    };

    // Attendre que l'hydratation soit complète
    const timeout = setTimeout(removeGrammarlyAttributes, 100);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}

