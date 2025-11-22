"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Users,
  MessageSquare,
  Shield,
  Menu,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
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
    const hasAccess = item.roles.some((role) => userRoles.includes(role));
    
    return hasAccess;
  });

  const SidebarContent = () => (
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent />
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
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}

