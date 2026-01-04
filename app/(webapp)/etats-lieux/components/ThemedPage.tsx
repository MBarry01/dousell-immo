"use client";

import { useTheme } from "../../theme-provider";
import { ReactNode } from "react";

export function ThemedPage({ children }: { children: ReactNode }) {
    const { isDark } = useTheme();

    return (
        <div className={isDark ? 'text-white' : 'text-gray-900'}>
            {children}
        </div>
    );
}

export function ThemedCard({ children, className = "" }: { children: ReactNode; className?: string }) {
    const { isDark } = useTheme();

    return (
        <div className={`${className} ${
            isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-gray-200'
        } border rounded-xl`}>
            {children}
        </div>
    );
}

export function ThemedText({
    children,
    variant = "primary",
    className = ""
}: {
    children: ReactNode;
    variant?: "primary" | "secondary" | "muted";
    className?: string;
}) {
    const { isDark } = useTheme();

    const colorClasses = {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-white/80' : 'text-gray-700',
        muted: isDark ? 'text-white/60' : 'text-gray-500'
    };

    return (
        <span className={`${colorClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}
