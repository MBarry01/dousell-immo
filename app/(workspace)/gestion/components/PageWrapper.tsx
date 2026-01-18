"use client";

import { useTheme } from '@/components/workspace/providers/theme-provider';
import { ReactNode } from "react";

export function PageWrapper({ children }: { children: ReactNode }) {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen print:hidden ${
            isDark ? 'bg-slate-950' : 'bg-gray-50'
        }`}>
            {children}
        </div>
    );
}
