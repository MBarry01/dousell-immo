"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Navigation pour propriétaires (/gestion) - 4 items principaux
const gestionNavItems: NavItem[] = [
  { href: "/gestion", icon: BarChart3, label: "Dashboard" },
  { href: "/gestion/biens", icon: Building2, label: "Biens" },
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
  { href: "/compte/mes-biens", icon: Building2, label: "Mes Biens" },
  { href: "/compte/favoris", icon: Heart, label: "Favoris" },
  { href: "/compte/parametres", icon: Settings, label: "Paramètres" },
];

export function WorkspaceBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollContainerRef = useRef<Element | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

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

  return (
    <nav

      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-lg lg:hidden print:hidden",
        "transition-transform duration-300 ease-out",
        !isVisible && "translate-y-full"
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {navItems.map((item) => {
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
            : item.href === "/gestion/comptabilite"
              ? 0
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false} // Disable prefetch to prevent stale RSC cache
              className="flex flex-1 flex-col items-center justify-center gap-1 min-w-0"
            >
              <span
                className={cn(
                  "relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  isActive
                    ? "text-[#F4C430] bg-[#F4C430]/10"
                    : "text-muted-foreground"
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "truncate w-full text-center text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-[#F4C430] font-semibold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
