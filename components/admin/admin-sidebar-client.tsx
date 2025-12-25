"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Home,
  Users,
  MessageSquare,
  Shield,
  Menu,
  UserCog,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserRoles, type UserRole } from "@/hooks/use-user-roles";
import { useAuth } from "@/hooks/use-auth";

type SubMenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

type NavItem = {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: UserRole[];
  submenu?: SubMenuItem[];
};

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "moderateur", "agent", "superadmin"]
  },
  {
    href: "/admin/dashboard",
    label: "Biens",
    icon: Home,
    roles: ["admin", "moderateur", "agent", "superadmin"]
  },
  {
    href: "/admin/moderation",
    label: "Modération",
    icon: Shield,
    roles: ["admin", "moderateur", "superadmin"]
  },
  {
    label: "Vérifications",
    icon: ShieldCheck,
    roles: ["admin", "superadmin"],
    submenu: [
      {
        href: "/admin/verifications/identites",
        label: "Identités (Profils)",
        icon: UserCheck,
        description: "CNI / Passeports"
      },
      {
        href: "/admin/verifications/biens",
        label: "Biens (Annonces)",
        icon: Home,
        description: "Titres de propriété"
      }
    ]
  },
  {
    href: "/admin/leads",
    label: "Leads/Messages",
    icon: MessageSquare,
    roles: ["admin", "moderateur", "agent", "superadmin"]
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: Users,
    roles: ["admin", "superadmin"]
  },
  {
    href: "/admin/roles",
    label: "Rôles",
    icon: UserCog,
    roles: ["admin", "superadmin"]
  },
];

type SidebarContentProps = {
  filteredNavItems: NavItem[];
  isActive: (href: string) => boolean;
};

function SidebarContent({ filteredNavItems, isActive }: SidebarContentProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0b0f18]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Dousell Immo</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;

          // Item with submenu
          if (item.submenu && item.submenu.length > 0) {
            const isOpen = openSubmenu === item.label;
            const hasActiveChild = item.submenu.some(sub => isActive(sub.href));

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    hasActiveChild || isOpen
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const active = isActive(subItem.href);

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <SubIcon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{subItem.label}</div>
                            {subItem.description && (
                              <div className="text-xs text-white/40">{subItem.description}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular item
          if (!item.href) return null;

          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminSidebarClient() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { roles: userRoles, loading } = useUserRoles(user?.id || null);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname?.startsWith(href);
  };

  // Vérifier si l'utilisateur est l'admin principal (fallback)
  const isMainAdmin = user?.email?.toLowerCase() === "barrymohamadou98@gmail.com";

  // Filtrer les items selon les rôles de l'utilisateur
  const filteredNavItems = navItems.filter((item) => {
    // Si pas de restriction de rôles, afficher toujours
    if (!item.roles || item.roles.length === 0) return true;

    // L'admin principal voit toujours tout
    if (isMainAdmin) return true;

    // Pendant le chargement, afficher tout pour éviter de cacher le menu
    if (loading) return true;

    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasAccess = item.roles.some((role: UserRole) => userRoles.includes(role));

    return hasAccess;
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent filteredNavItems={filteredNavItems} isActive={isActive} />
      </aside>

      {/* Mobile Sidebar */}
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
          <SidebarContent filteredNavItems={filteredNavItems} isActive={isActive} />
        </SheetContent>
      </Sheet>
    </>
  );
}
