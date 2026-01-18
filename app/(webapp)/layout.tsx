"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Scale,
    Settings,
    Building2,
    Wrench,
    MessageSquare,
    Sidebar,
    X,
    ChevronLeft,
    Wallet,
    ClipboardList,
    FolderOpen,
    Sun,
    Moon
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeProvider, useTheme } from "./theme-provider";

function WebAppLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { theme, toggleTheme, isDark } = useTheme();

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (!isAuthenticated) {
        return null;
    }

    const navItems = [
        {
            id: "tour-nav-etats-lieux",
            href: "/etats-lieux",
            icon: ClipboardList,
            label: "États des Lieux",
            isActive: pathname?.startsWith('/etats-lieux'),
        },
        {
            id: "tour-nav-interventions",
            href: "/interventions",
            icon: Wrench,
            label: "Interventions",
            isActive: pathname?.startsWith('/interventions'),
        },
        {
            id: "tour-nav-documents",
            href: "/gestion-locative/documents",
            icon: FolderOpen,
            label: "Documents",
            isActive: pathname?.startsWith('/gestion-locative/documents'),
        },
        {
            id: "tour-nav-messages",
            href: "/gestion-locative/messages",
            icon: MessageSquare,
            label: "Messagerie",
            isActive: pathname?.startsWith('/gestion-locative/messages'),
        },
        {
            id: "tour-nav-legal",
            href: "/documents-legaux",
            icon: Scale,
            label: "Juridique",
            isActive: pathname === '/documents-legaux',
        },
        {
            id: "tour-nav-accounting",
            href: "/gestion-locative/comptabilite",
            icon: Wallet,
            label: "Comptabilité",
            isActive: pathname === '/gestion-locative/comptabilite',
        },
    ];

    return (
        <div className={`flex flex-col h-[100dvh] w-screen overflow-hidden transition-colors ${isDark
            ? 'bg-black text-gray-100'
            : 'bg-gray-50 text-gray-900'
            }`}>

            {/* ========================================
                HEADER GLOBAL (Logo + Quitter)
                ======================================== */}
            <header className={`border-b shrink-0 z-50 transition-colors ${isDark
                ? 'bg-[#121212] border-gray-800'
                : 'bg-white border-gray-200'
                }`}
                style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 20px)" }}>
                <div className="h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu - Mobile only */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <Sidebar className="w-5 h-5" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/icons/icon-192.png"
                                width={32}
                                height={32}
                                alt="Dousell Immo"
                                className="rounded"
                            />
                        </Link>
                        <span className={`font-semibold text-lg border-l border-gray-700 pl-3 ${isDark ? 'text-[#F4C430]' : 'text-slate-900'}`}>
                            Gestion Locative
                        </span>
                    </div>

                    {/* Actions à droite */}
                    <div className="flex items-center gap-2">
                        {/* Bouton Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                }`}
                            title={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Bouton Quitter */}
                        <Link
                            href="/compte"
                            className={`text-sm px-3 py-2 rounded transition-colors ${isDark
                                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            <span className="hidden sm:inline">Quitter</span>
                            <X className="w-5 h-5 sm:hidden" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ========================================
                ZONE PRINCIPALE (Sidebar + Content)
                ======================================== */}
            <div className="flex-1 flex overflow-hidden">

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
                    fixed left-0 z-50
                    border-r
                    transform transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:static lg:h-full
                    ${isCollapsed ? 'w-64 lg:w-16' : 'w-64'}
                    ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}
                    flex flex-col
                    print:hidden
                `}
                    style={{
                        top: "calc(4rem + max(env(safe-area-inset-top, 0px), 20px))",
                        height: "calc(100dvh - (4rem + max(env(safe-area-inset-top, 0px), 20px)))"
                    }}>

                    {/* Sidebar Header avec bouton collapse */}
                    <div className={`h-12 flex items-center justify-between px-4 border-b shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'
                        }`}>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} ${isCollapsed ? 'lg:hidden' : ''}`}>
                            Navigation
                        </span>

                        {/* Collapse button - Desktop only */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`hidden lg:flex p-1.5 rounded-lg transition-colors ml-auto ${isDark
                                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                        </button>


                    </div>

                    {/* Navigation Links */}
                    <nav className={`p-3 space-y-1 flex-1 overflow-y-auto scrollbar-thin ${isDark ? 'scrollbar-thumb-slate-800' : 'scrollbar-thumb-gray-300'
                        }`}>
                        {/* Gestion Locative (Dashboard Principal) */}
                        <Link
                            href="/gestion-locative"
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-md
                                transition-colors duration-200 group
                                ${isCollapsed ? 'lg:justify-center' : ''}
                                ${(pathname === '/gestion-locative' || pathname?.startsWith('/gestion-locative/locataires'))
                                    ? isDark
                                        ? 'bg-gray-900 text-white font-medium'
                                        : 'bg-gray-100 text-gray-900 font-medium'
                                    : isDark
                                        ? 'text-gray-400 hover:text-gray-50 hover:bg-gray-900'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }
                            `}
                            title="Gestion Locative"
                        >
                            <Building2 className={`w-4 h-4 shrink-0 transition-colors ${(pathname === '/gestion-locative' || pathname?.startsWith('/gestion-locative/locataires'))
                                ? 'text-current'
                                : 'text-gray-500 group-hover:text-current'
                                }`} />
                            <span className={`text-sm ${isCollapsed ? 'lg:hidden' : ''}`}>Dashboard</span>
                        </Link>

                        {/* Séparateur */}
                        <div className={`h-px my-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

                        {/* Navigation principale */}
                        {navItems.map((item) => (
                            <Link
                                key={item.id}
                                id={item.id}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-md
                                    transition-colors duration-200 group
                                    ${isCollapsed ? 'lg:justify-center' : ''}
                                    ${item.isActive
                                        ? isDark
                                            ? 'bg-gray-900 text-white font-medium'
                                            : 'bg-gray-100 text-gray-900 font-medium'
                                        : isDark
                                            ? 'text-gray-400 hover:text-gray-50 hover:bg-gray-900'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }
                                `}
                                title={item.label}
                            >
                                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${item.isActive
                                    ? 'text-current'
                                    : 'text-gray-500 group-hover:text-current'
                                    }`} />
                                <span className={`text-sm ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom Section - Settings */}
                    <div className={`p-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                        <Link
                            href="/gestion-locative/config"
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-md
                                transition-colors
                                ${isCollapsed ? 'lg:justify-center' : ''}
                                ${isDark
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-900'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }
                            `}
                            title="Configuration"
                        >
                            <Settings className="w-5 h-5 shrink-0" />
                            <span className={`text-sm font-medium ${isCollapsed ? 'lg:hidden' : ''}`}>Configuration</span>
                        </Link>
                    </div>
                </aside>

                {/* ========================================
                    MAIN CONTENT AREA
                    ======================================== */}
                <main className={`flex-1 w-full h-full overflow-y-auto transition-colors ${isDark
                    ? 'bg-black'
                    : 'bg-gray-50'
                    }`}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function WebAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider>
            <WebAppLayoutContent>{children}</WebAppLayoutContent>
        </ThemeProvider>
    );
}
