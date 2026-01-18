"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("webapp-theme") as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Save theme to localStorage when it changes
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("webapp-theme", theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === "dark",
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Fallback pour les pages hors du ThemeProvider (ex: vitrine)
        // On retourne le thème sombre par défaut pour matcher le style vitrine
        return {
            theme: "dark",
            isDark: true,
            toggleTheme: () => { },
        } as ThemeContextType;
    }
    return context;
}
