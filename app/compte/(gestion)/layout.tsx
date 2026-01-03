"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Scale,
    Settings,
    Building2,
    Wrench,
    MessageSquare,
    Menu,
    X,
    ChevronLeft,
    Home,
    Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function GestionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth');
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
            id: "tour-nav-interventions",
            href: "/compte/interventions",
            icon: Wrench,
            label: "Interventions",
            isActive: pathname?.startsWith('/compte/interventions'),
        },
        {
            id: "tour-nav-messages",
            href: "/compte/gestion-locative/messages",
            icon: MessageSquare,
            label: "Messagerie",
            isActive: pathname?.startsWith('/compte/gestion-locative/messages'),
        },
        {
            id: "tour-nav-legal",
            href: "/compte/legal",
            icon: Scale,
            label: "Juridique",
            isActive: pathname === '/compte/legal',
        },
        {
            id: "tour-nav-accounting",
            href: "/compte/gestion-locative/comptabilite",
            icon: Wallet,
            label: "Comptabilité",
            isActive: pathname === '/compte/gestion-locative/comptabilite',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* ========================================
                SIDEBAR - Desktop (fixed) + Mobile (overlay)
                ======================================== */}

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full
                bg-slate-900 border-r border-slate-800
                transform transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static
                ${isCollapsed ? 'w-16' : 'w-64'}
                flex flex-col
            `}>
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                    {!isCollapsed && (
                        <Link href="/compte" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                <Home className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white text-sm">Mon compte</span>
                        </Link>
                    )}

                    {/* Collapse button - Desktop only */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Close button - Mobile only */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {/* Gestion Locative (Dashboard Principal) */}
                    <Link
                        href="/compte/gestion-locative"
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200 group
                            ${isCollapsed ? 'justify-center' : ''}
                            ${(pathname === '/compte/gestion-locative' || pathname?.startsWith('/compte/gestion-locative/locations'))
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }
                        `}
                        title="Gestion Locative"
                    >
                        <Building2 className={`w-5 h-5 shrink-0 ${(pathname === '/compte/gestion-locative' || pathname?.startsWith('/compte/gestion-locative/locations')) ? 'text-white' : ''}`} />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">Gestion Locative</span>
                        )}
                        {(pathname === '/compte/gestion-locative' || pathname?.startsWith('/compte/gestion-locative/locations')) && !isCollapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                    </Link>


                    {/* Séparateur */}
                    <div className="h-px bg-slate-800 my-3" />

                    {/* Navigation principale */}
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            id={item.id}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg
                                transition-all duration-200 group
                                ${isCollapsed ? 'justify-center' : ''}
                                ${item.isActive
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }
                            `}
                            title={item.label}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${item.isActive ? 'text-white' : ''}`} />
                            {!isCollapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                            )}
                            {item.isActive && !isCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section - Settings */}
                <div className="p-3 border-t border-slate-800 shrink-0">
                    <Link
                        href="/compte/gestion-locative/config"
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-slate-400 hover:text-white hover:bg-slate-800
                            transition-colors
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title="Configuration"
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">Configuration</span>
                        )}
                    </Link>
                </div>
            </aside>

            {/* ========================================
                MAIN CONTENT AREA
                ======================================== */}
            <div className="flex-1 min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-30 h-14 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
                    <div className="flex items-center justify-between h-full px-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <span className="text-sm font-medium text-white">
                            {navItems.find(item => item.isActive)?.label || 'Gestion'}
                        </span>

                        <Link
                            href="/compte/gestion-locative/config"
                            className="p-2 -mr-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
