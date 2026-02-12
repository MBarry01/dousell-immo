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

    // Initialisation
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("webapp-theme") as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Application du thème
    useEffect(() => {
        if (!mounted) return;

        localStorage.setItem("webapp-theme", theme);
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.remove("dark");
            root.classList.add("light");
        }
        root.setAttribute("data-theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === "dark",
    };

    return (
        <ThemeContext.Provider value={value}>
            {/* 
                IMPORTANT: We render children immediately to avoid hydration breakage on mobile.
                The 'mounted' check only controls the theme application side-effect.
            */}
            {children}
        </ThemeContext.Provider>
    );
}


export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Fallback pour les pages hors du ThemeProvider
        // Modification: On retourne le thème 'light' par défaut pour éviter les incohérences (cartes sombres sur fond blanc)
        // si le contexte est perdu.
        return {
            theme: "light",
            isDark: false,
            toggleTheme: () => { },
        } as ThemeContextType;
    }
    return context;
}
