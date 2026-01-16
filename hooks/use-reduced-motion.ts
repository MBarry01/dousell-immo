"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the `prefers-reduced-motion` CSS media query
 * 
 * @returns true if the user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check if we're in the browser
        if (typeof window === "undefined") return;

        // Get the media query
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Set initial value
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Modern browsers
        mediaQuery.addEventListener("change", handleChange);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    return prefersReducedMotion;
}

/**
 * Check if user prefers reduced motion (non-hook version for GSAP)
 * Use this inside GSAP callbacks where hooks can't be used
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
