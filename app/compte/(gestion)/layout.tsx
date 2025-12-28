"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Scale, Settings, Building2 } from "lucide-react";
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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Menu de navigation horizontal - Style Vercel */}
            <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-1 h-14">
                        {/* Logo / Retour */}
                        <Link
                            href="/compte"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors mr-4"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden md:inline">Tableau de bord</span>
                        </Link>

                        {/* Séparateur */}
                        <div className="w-px h-6 bg-slate-800" />

                        {/* Navigation principale */}
                        <NavLink
                            href="/compte/gestion-locative"
                            icon={Building2}
                            isActive={pathname?.startsWith('/compte/gestion-locative')}
                        >
                            Gestion Locative
                        </NavLink>

                        <Link
                            href="/compte/legal"
                            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/compte/legal'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                                }`}
                        >
                            <span className="hidden sm:inline">Assistant Juridique</span>
                            <span className="sm:hidden">Juridique</span>
                        </Link>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Config */}
                        <Link
                            href="/compte/gestion-locative/config"
                            className="p-2 hover:bg-slate-900 rounded-lg transition-colors"
                            title="Configuration"
                        >
                            <Settings className="w-4 h-4 text-slate-400" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Contenu de la page */}
            {children}
        </div>
    );
}

// Composant pour les liens de navigation avec état actif
function NavLink({
    href,
    icon: Icon,
    isActive,
    children,
}: {
    href: string;
    icon: any;
    isActive?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isActive
                ? 'bg-green-500/10 text-green-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{children}</span>
        </Link>
    );
}
