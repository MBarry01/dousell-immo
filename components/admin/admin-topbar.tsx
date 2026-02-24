"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Menu } from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function AdminTopbar() {
  const pathname = usePathname();

  // Générer le fil d'ariane
  const generateBreadcrumbs = () => {
    const paths = pathname?.split("/").filter(Boolean) || [];
    const breadcrumbs = [{ label: "Admin", href: "/admin" }];

    if (paths.length > 1) {
      const _currentPath = paths.slice(1).join("/");
      const pathLabels: Record<string, string> = {
        biens: "Biens",
        users: "Utilisateurs",
        leads: "Leads",
        settings: "Paramètres",
        dashboard: "Dashboard",
        nouveau: "Nouveau",
        moderation: "Modération",
        roles: "Rôles",
        abonnements: "Abonnements",
        verifications: "Vérifications",
        identites: "Identités",
        "activation-requests": "Demandes Activation",
      };

      paths.slice(1).forEach((segment, index) => {
        const href = `/${paths.slice(0, index + 2).join("/")}`;
        const label = pathLabels[segment] || segment;
        breadcrumbs.push({ label, href });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Navigation items (dupliqué depuis AdminSidebar pour éviter la dépendance circulaire)
  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/dashboard", label: "Biens" },
    { href: "/admin/moderation", label: "Modération" },
    { href: "/admin/leads", label: "Leads/Messages" },
    { href: "/admin/roles", label: "Rôles" },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0b0f18]/95 px-4 backdrop-blur-sm md:px-6">
      {/* Mobile Menu Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent className="left-0 top-0 h-full w-64 max-h-full rounded-none border-r border-t-0 p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <div className="flex h-full flex-col border-r border-white/10 bg-[#0b0f18]">
            <div className="flex h-16 items-center border-b border-white/10 px-6">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">Dousell Immo</span>
              </Link>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-6">
              {navItems.map((item) => {
                const active = pathname === item.href || 
                  (item.href === "/admin" && pathname === "/admin/dashboard");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-white/60">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Accueil</span>
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Nav */}
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}


