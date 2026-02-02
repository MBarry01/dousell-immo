"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useTheme } from "@/components/workspace/providers/theme-provider";

interface ThemedContentProps {
    isViewingTerminated: boolean;
    children: ReactNode;
    filterSection: ReactNode;
}

export function ThemedContent({ isViewingTerminated, children, filterSection }: ThemedContentProps) {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-full print:hidden ${isDark ? 'bg-slate-950' : 'bg-gray-50'
            }`}>
            {/* Sub-header avec filtres Actifs/Résiliés */}
            <div className={`border-b ${isDark
                ? 'border-slate-800 bg-slate-900/50'
                : 'border-gray-200 bg-white/50'
                }`}>
                <div className="w-full mx-auto px-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg ${isDark
                            ? 'bg-slate-900 border-slate-800'
                            : 'bg-white border-gray-200'
                            }`}>
                            <Link
                                href="/gestion"
                                className={`px-3 py-1 text-xs font-medium rounded transition-all ${!isViewingTerminated
                                    ? 'bg-green-500/10 text-green-400'
                                    : isDark
                                        ? 'text-slate-400 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Actifs
                            </Link>
                            <Link
                                href="/gestion?view=terminated"
                                className={`px-3 py-1 text-xs font-medium rounded transition-all ${isViewingTerminated
                                    ? 'bg-brand/10 text-brand'
                                    : isDark
                                        ? 'text-slate-400 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Résiliés
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            {filterSection}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-2 py-6">
                {children}
            </div>
        </div>
    );
}

export function ThemedWidget({
    title,
    linkHref,
    linkText,
    children
}: {
    title: string;
    linkHref: string;
    linkText: string;
    children: ReactNode;
}) {
    const { isDark } = useTheme();

    return (
        <div className={`border rounded-lg p-4 ${isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {title}
                </h3>
                <Link
                    href={linkHref}
                    className={`text-xs transition-colors ${isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    {linkText} →
                </Link>
            </div>
            {children}
        </div>
    );
}
