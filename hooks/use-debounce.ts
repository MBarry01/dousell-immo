import { useEffect, useState } from "react";

/**
 * Hook de debounce pour optimiser les recherches et les appels API
 * @param value - Valeur à debounce
 * @param delay - Délai en millisecondes (défaut: 500ms)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timeout pour mettre à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timeout si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
