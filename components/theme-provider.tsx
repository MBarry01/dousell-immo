"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * Unified Theme Provider
 * Handles hydration stabilization and provides a stable useTheme hook
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            {children}
        </NextThemesProvider>
    );
}

/**
 * Enhanced useTheme hook
 * Provides 'mounted' state and 'isDark' helper to avoid hydration mismatches
 */
export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    // Stable defaults during hydration
    if (!mounted) {
        return {
            theme: "dark" as const,
            setTheme,
            resolvedTheme: "dark" as const,
            toggleTheme,
            isDark: true,
            mounted: false
        };
    }

    return {
        theme: (theme || "dark") as string,
        setTheme,
        resolvedTheme: (resolvedTheme || "dark") as string,
        toggleTheme,
        isDark: resolvedTheme === "dark",
        mounted: true
    };
}
