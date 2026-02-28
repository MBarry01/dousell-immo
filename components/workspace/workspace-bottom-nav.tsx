"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { useOwnerUnreadCounts } from "@/hooks/use-unread-counts";
import { createClient } from "@/utils/supabase/client";
import {
  Building2,
  Home,
  Wrench,
  Wallet,
  User,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Shield,
  Heart,
  Settings,
  Plus
} from "lucide-react";
import { IconBuildingEstate } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Navigation pour propriétaires (/gestion) - 4 items principaux
const gestionNavItems: NavItem[] = [
  { href: "/gestion", icon: BarChart3, label: "Dashboard" },
  { href: "/gestion/biens", icon: IconBuildingEstate as any, label: "Biens" },
  { href: "/gestion/interventions", icon: Wrench, label: "Travaux" },
  { href: "/gestion/comptabilite", icon: Wallet, label: "Compta" },
];

// Navigation pour locataires (/locataire)
const locataireNavItems: NavItem[] = [
  { href: "/locataire", icon: Home, label: "Accueil" },
  { href: "/locataire/documents", icon: FileText, label: "Documents" },
  { href: "/locataire/paiements", icon: CreditCard, label: "Paiements" },
  { href: "/locataire/maintenance", icon: Wrench, label: "Demandes" },
];

// Navigation pour admin (/admin)
const adminNavItems: NavItem[] = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/verifications", icon: Shield, label: "Vérifs" },
  { href: "/admin/moderation", icon: Settings, label: "Modération" },
];

// Navigation pour compte (/compte)
const compteNavItems: NavItem[] = [
  { href: "/compte", icon: User, label: "Profil" },
  { href: "/compte/mes-biens", icon: IconBuildingEstate as any, label: "Mes Biens" },
  { href: "/compte/favoris", icon: Heart, label: "Favoris" },
  { href: "/compte/parametres", icon: Settings, label: "Paramètres" },
];

export function WorkspaceBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollContainerRef = useRef<Element | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Theme-aware styling
  const { isDark } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Get user and team for badge counts
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Get active team from cookie or team_members
        const savedTeam = document.cookie
          .split("; ")
          .find((c) => c.startsWith("current_team_id="))
          ?.split("=")[1];
        if (savedTeam) setTeamId(savedTeam);
      }
    });
  }, []);

  const badgeCounts = useOwnerUnreadCounts(
    pathname?.startsWith("/gestion") ? userId : null,
    teamId
  );


  // Determine FAB href and label based on context
  const { fabHref, fabLabel } = useMemo(() => {
    if (pathname?.startsWith("/gestion/biens")) {
      return { fabHref: "/gestion/biens/nouveau", fabLabel: "Ajouter un bien" };
    }
    if (pathname?.startsWith("/gestion/interventions")) {
      return { fabHref: "/gestion/interventions?action=add", fabLabel: "Signaler un problème" };
    }
    if (pathname?.startsWith("/gestion/comptabilite")) {
      return { fabHref: "/gestion/comptabilite?action=add", fabLabel: "Ajouter une dépense" };
    }
    if (pathname?.startsWith("/gestion/etats-lieux")) {
      return { fabHref: "/gestion/etats-lieux/new", fabLabel: "Nouvel état des lieux" };
    }
    if (pathname?.startsWith("/gestion")) {
      return { fabHref: "/gestion?add=tenant", fabLabel: "Ajouter un locataire" };
    }
    return { fabHref: "/", fabLabel: "Accueil" };
  }, [pathname]);

  // Déterminer le contexte et les items de navigation
  const navItems = useMemo(() => {
    if (pathname?.startsWith("/gestion")) return gestionNavItems;
    if (pathname?.startsWith("/locataire")) return locataireNavItems;
    if (pathname?.startsWith("/admin")) return adminNavItems;
    return compteNavItems;
  }, [pathname]);

  useEffect(() => {
    // Attendre que le DOM soit stable avant de chercher le conteneur
    // (évite les race conditions sur mobile lors de la navigation)
    const timeoutId = setTimeout(() => {
      try {
        const scrollContainer = document.querySelector("main.overflow-y-auto");
        if (!scrollContainer) return;

        // Initialisation
        const initVisibility = () => {
          const currentScroll = scrollContainer.scrollTop;
          lastScrollY.current = currentScroll;

          if (currentScroll > 100) {
            setTimeout(() => setIsVisible(false), 0);
          } else {
            setTimeout(() => setIsVisible(true), 0);
          }
        };

        initVisibility();

        const handleScroll = () => {
          if (!ticking.current) {
            requestAnimationFrame(() => {
              const currentScrollY = scrollContainer.scrollTop;
              const scrollDelta = currentScrollY - lastScrollY.current;

              if (Math.abs(scrollDelta) > 10) {
                if (scrollDelta > 0 && currentScrollY > 100) {
                  setIsVisible(false);
                } else if (scrollDelta < 0) {
                  setIsVisible(true);
                }
                lastScrollY.current = currentScrollY;
              }

              ticking.current = false;
            });
            ticking.current = true;
          }
        };

        scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

        // Stocker la ref pour le cleanup
        scrollContainerRef.current = scrollContainer;
        scrollHandlerRef.current = handleScroll;
      } catch (_err) {
        // Silently ignore DOM errors on mobile navigation
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      const container = scrollContainerRef.current;
      const handler = scrollHandlerRef.current;
      if (container && handler) {
        container.removeEventListener("scroll", handler);
      }
    };
  }, [pathname]);

  // Toujours visible au changement de page
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 0);
    lastScrollY.current = 0;
  }, [pathname]);

  if (!mounted) return null;

  // Theme-aware colors
  const activeColor = isDark ? '#F4C430' : '#0f172a'; // Gold in dark, Slate-900 in light
  const activeBg = isDark ? 'rgba(244, 196, 48, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  const inactiveColor = isDark ? '#9da7b9' : '#64748b';
  const navBg = isDark ? 'rgba(5, 8, 12, 0.85)' : 'rgba(255, 255, 255, 0.9)';

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 lg:hidden print:hidden",
        "transition-transform duration-300 ease-out",
        !isVisible && "translate-y-[200%]"
      )}
    >
      {/* Conteneur de navigation principal */}
      <nav
        className="relative"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(60px + env(safe-area-inset-bottom))",
          backgroundColor: "transparent", // Background handled by SVG
        }}
      >
        {/* SVG Background with "Real Hole" */}
        <div className="absolute inset-x-0 top-0 h-[60px] -z-10 pointer-events-none">
          {/* 
            SVG Path Explanation:
            M 0,60: Start bottom-left
            L 0,0: Line to top-left 
            L 370,0: Start of cutout
            C 410,0 420,38 500,38: Curve to center bottom (depth 38)
            C 580,38 590,0 630,0: Curve back to top edge
            L 1000,0: Line to top-right
            L 1000,60: Bottom-right
          */}
          <svg
            viewBox="0 0 1000 60"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-hidden="true"
            style={{ filter: "drop-shadow(0 -2px 10px rgba(0,0,0,0.1))" }}
          >
            <path
              d="M 0,60 L 0,0 L 370,0 C 410,0 420,38 500,38 C 580,38 590,0 630,0 L 1000,0 L 1000,60 Z"
              fill={navBg}
              fillOpacity={isDark ? "0.95" : "0.98"}
            />
            {/* Outline/Border for the path */}
            <path
              d="M 0,0 L 370,0 C 410,0 420,38 500,38 C 580,38 590,0 630,0 L 1000,0"
              fill="none"
              stroke={isDark ? "white" : "black"}
              strokeOpacity={isDark ? "0.08" : "0.06"}
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div
          className="absolute inset-x-0 top-[60px] bottom-0 -z-10 pointer-events-none"
          style={{ backgroundColor: navBg, opacity: isDark ? 0.95 : 0.98 }}
        />

        <div className="mx-auto flex h-full w-full items-center justify-between px-2 text-[10px] font-medium">
          {/* Section Gauche */}
          <div className="flex flex-1 justify-around">
            {leftItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/gestion" &&
                  item.href !== "/locataire" &&
                  item.href !== "/admin" &&
                  item.href !== "/compte" &&
                  pathname?.startsWith(`${item.href}/`));

              const Icon = item.icon;

              // Badge count for this item
              const badgeCount = item.href === "/gestion/interventions"
                ? badgeCounts.pendingMaintenance
                : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="flex flex-col items-center justify-center gap-1 px-1 py-1 transition-transform active:scale-90"
                >
                  <span
                    className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                    style={{
                      color: isActive ? activeColor : inactiveColor,
                      backgroundColor: isActive ? activeBg : 'transparent',
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </span>
                  <span
                    className="truncate w-full text-center text-[10px] transition-colors duration-200"
                    style={{
                      color: isActive ? activeColor : inactiveColor,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Espace central pour le FAB */}
          <div className="w-[80px]" aria-hidden="true" />

          {/* Section Droite */}
          <div className="flex flex-1 justify-around">
            {rightItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/gestion" &&
                  item.href !== "/locataire" &&
                  item.href !== "/admin" &&
                  item.href !== "/compte" &&
                  pathname?.startsWith(`${item.href}/`));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="flex flex-col items-center justify-center gap-1 px-1 py-1 transition-transform active:scale-90"
                >
                  <span
                    className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                    style={{
                      color: isActive ? activeColor : inactiveColor,
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                  </span>
                  <span
                    className="truncate w-full text-center text-[10px] transition-colors duration-200"
                    style={{
                      color: isActive ? activeColor : inactiveColor,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* FAB Central Button - Dynamic based on path */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <button
          onClick={() => router.push(fabHref)}
          className={cn(
            "flex h-[56px] w-[56px] items-center justify-center rounded-full bg-transparent shadow-xl backdrop-blur-sm",
            "border-[1.5px] transition-all active:scale-95",
            isDark ? "border-white/20 hover:bg-white/5" : "border-black/10 hover:bg-black/5",
            "focus:outline-none"
          )}
          style={{
            color: inactiveColor,
          }}
          aria-label={fabLabel}
        >
          {pathname?.startsWith("/gestion") ? (
            <Plus className="h-6 w-6 stroke-[2.5]" />
          ) : (
            <Home className="h-5 w-5 stroke-[2]" />
          )}
        </button>
      </div>
    </div>
  );
}
