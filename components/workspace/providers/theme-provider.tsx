import { useTheme as useNextTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

/**
 * Workspace Theme Bridge
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log("[ThemeBridge] ✓ Hook mounted (Client side)");
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    // Stable defaults during hydration to avoid mismatches and crashes
    if (!mounted) {
        return {
            theme: "dark" as const,
            toggleTheme,
            isDark: true,
            mounted: false
        };
    }

    return {
        theme: (resolvedTheme || theme || "dark") as "dark" | "light",
        toggleTheme,
        isDark: resolvedTheme === "dark",
        mounted: true
    };
}
