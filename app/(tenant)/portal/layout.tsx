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
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            {/* Header Desktop / Tablette */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-md mx-auto md:max-w-5xl px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl text-slate-900">
                        <span className="text-blue-600">Doussel</span>Loc
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 hidden md:block">
                            {user?.email}
                        </span>
                        <Link href="/auth/signout" className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto md:max-w-5xl py-6 animate-in fade-in duration-300">
                {children}
            </main>

            {/* Navigation Mobile (Bottom Bar) */}
            <TenantMobileNav />
        </div>
    );
}
