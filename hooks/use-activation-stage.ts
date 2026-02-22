"use client";

import { useState, useEffect } from "react";

const STAGE_KEY = "activation-stage";

/**
 * Reads the activation stage from localStorage.
 * The ActivationBanner writes it server-side on every /gestion load.
 * Returns null until hydrated (avoids SSR mismatch).
 */
export function useActivationStage(): number | null {
  const [stage, setStage] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const raw = localStorage.getItem(STAGE_KEY);
      setStage(raw ? parseInt(raw, 10) : null);
    };

    read();

    // Listen for updates from ActivationBanner (same-tab stage advancement)
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      setStage(detail);
    };
    window.addEventListener("activation-stage-changed", handler);
    return () => window.removeEventListener("activation-stage-changed", handler);
  }, []);

  return stage;
}
