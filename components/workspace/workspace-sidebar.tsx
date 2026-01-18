"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  Wrench,
  MessageSquare,
  FolderOpen,
  Scale,
  Wallet,
  Settings,
  User,
  Bell,
  Home,
  FileText,
  CreditCard,
  Users,
  Shield,
  BarChart3,
  ChevronLeft,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Navigation pour propriétaires (/gestion)
const gestionNavItems: NavItem[] = [
  { href: "/gestion", icon: Building2, label: "Dashboard" },
  { href: "/gestion/etats-lieux", icon: ClipboardList, label: "États des Lieux" },
  { href: "/gestion/interventions", icon: Wrench, label: "Interventions" },
  { href: "/gestion/documents", icon: FolderOpen, label: "Documents" },
  { href: "/gestion/messages", icon: MessageSquare, label: "Messagerie" },
  { href: "/gestion/documents-legaux", icon: Scale, label: "Juridique" },
  { href: "/gestion/comptabilite", icon: Wallet, label: "Comptabilité" },
];

// Navigation pour locataires (/locataire)
const locataireNavItems: NavItem[] = [
  { href: "/locataire", icon: Home, label: "Mon Espace" },
  { href: "/locataire/documents", icon: FileText, label: "Documents" },
  { href: "/locataire/paiements", icon: CreditCard, label: "Paiements" },
  { href: "/locataire/maintenance", icon: Wrench, label: "Maintenance" },
  { href: "/locataire/messages", icon: MessageSquare, label: "Messages" },
];

// Navigation pour admin (/admin)
const adminNavItems: NavItem[] = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Utilisateurs" },
  { href: "/admin/verifications", icon: Shield, label: "Vérifications" },
  { href: "/admin/moderation", icon: Scale, label: "Modération" },
  { href: "/admin/roles", icon: Settings, label: "Rôles" },
];

// Navigation pour compte (/compte)
const compteNavItems: NavItem[] = [
  { href: "/compte", icon: User, label: "Mon Profil" },
  { href: "/compte/mes-biens", icon: Building2, label: "Mes Biens" },
  { href: "/compte/favoris", icon: Home, label: "Favoris" },
  { href: "/compte/alertes", icon: Bell, label: "Alertes" },
  { href: "/compte/parametres", icon: Settings, label: "Paramètres" },
];

function SidebarContent({
  isCollapsed,
  onCollapse,
  isMobile = false
}: {
  isCollapsed: boolean;
  onCollapse?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();

  // Déterminer le contexte et les items de navigation
  const { navItems, title } = useMemo(() => {
    if (pathname?.startsWith("/gestion")) {
      return { navItems: gestionNavItems, title: "Gestion Locative" };
    }
    if (pathname?.startsWith("/locataire")) {
      return { navItems: locataireNavItems, title: "Espace Locataire" };
    }
    if (pathname?.startsWith("/admin")) {
      return { navItems: adminNavItems, title: "Administration" };
    }
    return { navItems: compteNavItems, title: "Mon Compte" };
  }, [pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Sidebar */}
      <div className={cn(
        "h-14 flex items-center border-b border-border shrink-0",
        isCollapsed && !isMobile ? "justify-center px-2" : "justify-between px-4"
      )}>
        {(!isCollapsed || isMobile) && (
          <span className="text-sm font-semibold text-foreground truncate">
            {title}
          </span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-foreground"
            onClick={onCollapse}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/gestion" &&
              item.href !== "/locataire" &&
              item.href !== "/admin" &&
              item.href !== "/compte" &&
              pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:translate-x-1",
                isCollapsed && !isMobile ? "justify-center" : "",
                isActive
                  ? "bg-[#0F172A] text-white shadow-md font-medium dark:bg-primary/10 dark:text-primary"
                  : "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              {(() => {
                const Icon = item.icon;
                return <Icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-white dark:text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />;
              })()}
              {(!isCollapsed || isMobile) && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Config/Settings (Uniquement pour le SaaS / Gestion) */}
      {pathname?.startsWith("/gestion") && (
        <div className="p-2 border-t border-border shrink-0">
          <Link
            href="/gestion/config"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isCollapsed && !isMobile ? "justify-center" : "",
              "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={isCollapsed && !isMobile ? "Configuration" : undefined}
          >
            <SlidersHorizontal className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm">Configuration</span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

export function WorkspaceSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 h-10 w-10 bg-background/80 backdrop-blur-sm border text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64 p-0 fixed left-0 top-0 h-full rounded-none slide-in-from-left">
          <SidebarContent
            isCollapsed={false}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Sidebar fixe */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full border-r border-border bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>
    </>
  );
}
