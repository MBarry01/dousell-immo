"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useTheme } from "@/components/theme-provider";

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
                <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        <div className={`flex items-center gap-1 px-1 sm:px-2 py-1 border rounded-xl no-select shrink-0 ${isDark
                            ? 'bg-slate-900/50 border-slate-800'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <Link
                                href="/gestion"
                                className={`px-3 sm:px-5 h-8 sm:h-10 flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-lg transition-all active:scale-95 ${!isViewingTerminated
                                    ? isDark
                                        ? 'bg-slate-700 text-white shadow-lg'
                                        : 'bg-white text-slate-900 shadow-sm'
                                    : isDark
                                        ? 'text-slate-500 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Actifs
                            </Link>
                            <Link
                                href="/gestion?view=terminated"
                                className={`px-3 sm:px-5 h-8 sm:h-10 flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-lg transition-all active:scale-95 ${isViewingTerminated
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-red-400 hover:text-red-600'
                                    }`}
                            >
                                Résiliés
                            </Link>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {filterSection}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 lg:px-8 py-6">
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
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-200' : 'text-slate-900'
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
