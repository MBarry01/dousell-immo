"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
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
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useOwnerUnreadCounts } from "@/hooks/use-unread-counts";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { TeamSwitcher } from "./TeamSwitcher";
import { TemporaryAccessWidget } from "./TemporaryAccessWidget";
import { LockedSidebarItem } from "./LockedSidebarItem";
import { AccessRequestModal, useAccessRequestModal } from "@/components/modals/AccessRequestModal";
import type { TeamPermissionKey } from "@/lib/team-permissions";

import type { LucideIcon } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  slug: string;
  role: string;
  subscription_tier?: string;
}

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredPermission?: TeamPermissionKey; // Permission requise pour accéder
  requiredTier?: 'pro' | 'enterprise'; // Tier minimum requis
}

// Navigation pour propriétaires (/gestion) avec permissions
const gestionNavItems: NavItem[] = [
  { href: "/gestion", icon: LayoutDashboard, label: "Dashboard" }, // Accessible à tous
  { href: "/gestion/biens", icon: Home, label: "Biens", requiredPermission: "properties.view" },
  { href: "/gestion/etats-lieux", icon: ClipboardList, label: "États des Lieux", requiredPermission: "inventory.view" },
  { href: "/gestion/interventions", icon: Wrench, label: "Interventions", requiredPermission: "maintenance.view", requiredTier: 'pro' },
  { href: "/gestion/documents", icon: FolderOpen, label: "Documents", requiredPermission: "documents.view" },
  { href: "/gestion/messages", icon: MessageSquare, label: "Messagerie" }, // Accessible à tous
  { href: "/gestion/documents-legaux", icon: Scale, label: "Juridique", requiredPermission: "documents.generate" },
  { href: "/gestion/comptabilite", icon: Wallet, label: "Comptabilité", requiredPermission: "payments.view", requiredTier: 'pro' },
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
  teams?: TeamData[];
  currentTeamId?: string;
  onSwitchTeam?: (teamId: string) => Promise<void>;
  onRequestAccess?: (permission: TeamPermissionKey, label: string) => void;
  badgeCounts?: { unreadMessages: number; pendingMaintenance: number };
}

function SidebarContent({
  isCollapsed,
  onCollapse,
  isMobile = false,
  onMobileNavigate,
  teams = [],
  currentTeamId,
  onSwitchTeam,
  onRequestAccess,
  badgeCounts = { unreadMessages: 0, pendingMaintenance: 0 },
}: SidebarContentProps) {
  const pathname = usePathname();
  const isGestionRoute = pathname?.startsWith("/gestion");

  // Trouver l'équipe courante pour afficher son nom
  const currentTeam = teams.find((t) => t.id === currentTeamId);

  // Déterminer le contexte et les items de navigation
  const { navItems, title } = useMemo(() => {
    if (pathname?.startsWith("/gestion")) {
      // Utiliser le nom de l'équipe/agence si disponible, sinon fallback
      const teamName = currentTeam?.name || "Gestion Locative";
      return { navItems: gestionNavItems, title: teamName };
    }
    if (pathname?.startsWith("/locataire")) {
      return { navItems: locataireNavItems, title: "Espace Locataire" };
    }
    if (pathname?.startsWith("/admin")) {
      return { navItems: adminNavItems, title: "Administration" };
    }
    return { navItems: compteNavItems, title: "Mon Compte" };
  }, [pathname, currentTeam]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Sidebar */}
      <div className={cn(
        "h-14 flex items-center justify-between border-b border-border shrink-0",
        // Consistent left padding for title or back button
        "pl-4 pr-2"
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

      {/* Team Switcher (only for /gestion routes) */}
      {isGestionRoute && teams.length > 0 && (
        <div className={cn(
          "p-2 border-b border-border shrink-0",
          isCollapsed && !isMobile && "flex items-center justify-center"
        )}>
          <TeamSwitcher
            teams={teams}
            currentTeamId={currentTeamId || teams[0]?.id}
            isCollapsed={isCollapsed && !isMobile}
            onSwitchTeam={onSwitchTeam}
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          // Compute badge for this item
          const badgeCount = item.href === "/gestion/messages"
            ? badgeCounts.unreadMessages
            : item.href === "/gestion/interventions"
              ? badgeCounts.pendingMaintenance
              : 0;
          const isActive = pathname === item.href ||
            (item.href !== "/gestion" &&
              item.href !== "/locataire" &&
              item.href !== "/admin" &&
              item.href !== "/compte" &&
              pathname?.startsWith(`${item.href}/`));

          // Utiliser LockedSidebarItem pour les items avec permission requise OU tier requis
          if ((item.requiredPermission || item.requiredTier) && isGestionRoute) {
            return (
              <LockedSidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                requiredPermission={item.requiredPermission}
                requiredTier={item.requiredTier}
                currentTeamId={currentTeamId}
                currentTeamTier={currentTeam?.subscription_tier}
                onNavigate={() => isMobile && onMobileNavigate?.()}
                onRequestAccess={onRequestAccess}
                badgeCount={badgeCount}
              />
            );
          }

          // Item normal sans restriction
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false} // Disable prefetch to prevent stale RSC cache
              onClick={() => isMobile && onMobileNavigate?.()}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group h-11",
                "px-[14px]",
                isActive
                  ? "bg-[#0F172A] text-white shadow-md font-medium dark:bg-primary/10 dark:text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              {(() => {
                const Icon = item.icon;
                return (
                  <span className="relative shrink-0">
                    <Icon className={cn(
                      "h-5 w-5 transition-all",
                      isActive ? "text-white dark:text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {badgeCount > 0 && isCollapsed && !isMobile && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </span>
                );
              })()}
              {(!isCollapsed || isMobile) && (
                <>
                  <span className="text-sm truncate ml-3 flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ml-auto">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Widget Permissions Temporaires (Uniquement pour /gestion) */}
      {pathname?.startsWith("/gestion") && (
        <div className="shrink-0">
          <TemporaryAccessWidget collapsed={isCollapsed && !isMobile} />
        </div>
      )}

      {/* Footer - Config/Settings (Uniquement pour le SaaS / Gestion) */}
      {pathname?.startsWith("/gestion") && (
        <div className="p-2 border-t border-border shrink-0 space-y-1">
          <LockedSidebarItem
            href="/gestion/equipe"
            icon={Users}
            label="Équipe"
            isActive={pathname === "/gestion/equipe" || pathname?.startsWith("/gestion/equipe/")}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            requiredPermission="team.members.view"
            currentTeamId={currentTeamId}
            onNavigate={() => isMobile && onMobileNavigate?.()}
            onRequestAccess={onRequestAccess}
          />
          <LockedSidebarItem
            href="/gestion/config"
            icon={SlidersHorizontal}
            label="Configuration"
            isActive={pathname === "/gestion/config" || pathname?.startsWith("/gestion/config/")}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            requiredPermission="team.settings.view"
            currentTeamId={currentTeamId}
            onNavigate={() => isMobile && onMobileNavigate?.()}
            onRequestAccess={onRequestAccess}
          />
        </div>
      )}

      {/* Footer - Accès Gestion Locative (pour pages /compte) */}
      {pathname?.startsWith("/compte") && (
        <div className="p-2 border-t border-border shrink-0">
          <Link
            href="/gestion"
            onClick={() => isMobile && onMobileNavigate?.()}
            className={cn(
              "flex items-center rounded-lg transition-all px-[14px] h-11",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            title={isCollapsed && !isMobile ? "Gestion Locative" : undefined}
          >
            <Building2 className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium ml-3">Gestion Locative</span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

interface WorkspaceSidebarProps {
  teams?: TeamData[];
  currentTeamId?: string;
  onSwitchTeam?: (teamId: string) => Promise<void>;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function WorkspaceSidebar({
  teams = [],
  currentTeamId,
  onSwitchTeam,
  isMobileOpen = false,
  onMobileOpenChange,
}: WorkspaceSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get the current user ID for the unread counts hook
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const badgeCounts = useOwnerUnreadCounts(userId, currentTeamId || null);

  // Hook pour gérer la modale de demande d'accès
  const { open: openAccessModal, Modal: AccessModal, isOpen: isAccessModalOpen } = useAccessRequestModal();

  // Callback pour demander un accès temporaire
  const handleRequestAccess = useCallback((permission: TeamPermissionKey, label: string) => {
    if (!currentTeamId) return;
    openAccessModal({
      teamId: currentTeamId,
      permission,
      permissionLabel: label,
      permissionDescription: `Accès requis pour la section "${label}"`,
    });
  }, [currentTeamId, openAccessModal]);

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
      {/* Mobile: Sheet/Drawer - Controlled from Layout/Header */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-64 p-0 rounded-none bg-background border-r border-border"
          hideClose={true}
        >
          {/* SheetTitle caché pour l'accessibilité (screen readers) */}
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SidebarContent
            isCollapsed={false}
            isMobile={true}
            onMobileNavigate={() => onMobileOpenChange?.(false)}
            teams={teams}
            currentTeamId={currentTeamId}
            onSwitchTeam={onSwitchTeam}
            onRequestAccess={handleRequestAccess}
            badgeCounts={badgeCounts}
          />
        </SheetContent>
      </Sheet>

      {/* Modale de demande d'accès */}
      <AccessModal />

      {/* Desktop: Sidebar fixe */}
      <div
        className="hidden lg:block relative h-full w-16 shrink-0 z-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <aside
          className={cn(
            "absolute top-0 left-0 h-full flex flex-col border-r border-border bg-background transition-all duration-300 ease-out",
            isCollapsed ? "w-16" : "w-64 shadow-2xl"
          )}
        >
          <SidebarContent
            isCollapsed={isCollapsed}
            onCollapse={() => setIsCollapsed(!isCollapsed)}
            teams={teams}
            currentTeamId={currentTeamId}
            onSwitchTeam={onSwitchTeam}
            onRequestAccess={handleRequestAccess}
            badgeCounts={badgeCounts}
          />
        </aside>
      </div>
    </>
  );
}
