import { TenantDesktopNav } from "./components/TenantDesktopNav";
import { TenantMobileNav } from "./components/TenantMobileNav";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-slate-950 pb-20 md:pb-0">
            {/* Header style Gestion Locative */}
            <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-lg">
                <div className="w-full mx-auto px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-base sm:text-lg font-bold text-white">
                                <span className="text-orange-400">Doussel</span>Loc
                            </div>
                            <span className="hidden sm:inline-block text-xs text-slate-500">|</span>
                            <span className="text-xs text-slate-400">Espace Locataire</span>
                        </div>
                        <TenantDesktopNav />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[10px] sm:text-xs text-slate-400 hidden md:block max-w-[200px] truncate">
                            {user?.email}
                        </span>
                        <Link
                            href="/auth/signout"
                            className="p-2 sm:p-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="w-full mx-auto px-4 md:px-6 py-4 sm:py-6 animate-in fade-in duration-500">
                {children}
            </main>

            {/* Navigation Mobile (Bottom Bar) */}
            <TenantMobileNav />
        </div>
    );
}
