"use client";

import { useTheme as useNextTheme } from "next-themes";
import { ReactNode } from "react";

/**
 * Workspace Theme Bridge
 * 
 * We no longer use a custom ThemeProvider here to avoid clashing with next-themes.
 * This file now provides a bridge so existing workspace components can still use
 * 'isDark' and other legacy props without breaking.
 */

export function ThemeProvider({ children }: { children: ReactNode }) {
    // This is now a pass-through. The real provider is in the root layout.
    return <>{children}</>;
}

export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useNextTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return {
        theme: (resolvedTheme || theme || "dark") as "dark" | "light",
        toggleTheme,
        isDark: resolvedTheme === "dark",
    };
}
