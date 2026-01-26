"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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
  X,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";

import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Navigation pour propriétaires (/gestion)
const gestionNavItems: NavItem[] = [
  { href: "/gestion", icon: Building2, label: "Dashboard" },
  { href: "/gestion/biens", icon: Home, label: "Biens" },
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

interface SidebarContentProps {
  isCollapsed: boolean;
  onCollapse?: () => void;
  isMobile?: boolean;
  onMobileNavigate?: () => void;
}

function SidebarContent({
  isCollapsed,
  onCollapse,
  isMobile = false,
  onMobileNavigate
}: SidebarContentProps) {
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

        {isMobile && (
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
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
              pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onMobileNavigate?.()}
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
        <div className="p-2 border-t border-border shrink-0 space-y-1">
          <Link
            href="/gestion/equipe"
            onClick={() => isMobile && onMobileNavigate?.()}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isCollapsed && !isMobile ? "justify-center" : "",
              "text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={isCollapsed && !isMobile ? "Équipe" : undefined}
          >
            <Users className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm">Équipe</span>
            )}
          </Link>
          <Link
            href="/gestion/config"
            onClick={() => isMobile && onMobileNavigate?.()}
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

      {/* Footer - Accès Gestion Locative (pour pages /compte) */}
      {pathname?.startsWith("/compte") && (
        <div className="p-2 border-t border-border shrink-0">
          <Link
            href="/gestion"
            onClick={() => isMobile && onMobileNavigate?.()}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isCollapsed && !isMobile ? "justify-center" : "",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            title={isCollapsed && !isMobile ? "Gestion Locative" : undefined}
          >
            <Building2 className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium">Gestion Locative</span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

export function WorkspaceSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion du hover avec délai pour éviter les bugs de flickering
  const handleMouseEnter = useCallback(() => {
    // Annuler tout timer de fermeture en cours
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Délai avant de replier pour éviter les fermetures accidentelles
    collapseTimeoutRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 200); // 200ms de délai
  }, []);

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-3 z-50 h-10 w-10 text-foreground hover:bg-transparent"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 rounded-none bg-[#0b0f18] border-r border-white/10"
          hideClose={true}
        >
          {/* SheetTitle caché pour l'accessibilité (screen readers) */}
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SidebarContent
            isCollapsed={false}
            isMobile={true}
            onMobileNavigate={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Sidebar fixe */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full border-r border-border bg-background transition-all duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>
    </>
  );
}
