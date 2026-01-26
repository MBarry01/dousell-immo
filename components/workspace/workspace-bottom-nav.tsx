"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
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
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Déterminer le contexte et les items de navigation
  const navItems = useMemo(() => {
    if (pathname?.startsWith("/gestion")) return gestionNavItems;
    if (pathname?.startsWith("/locataire")) return locataireNavItems;
    if (pathname?.startsWith("/admin")) return adminNavItems;
    return compteNavItems;
  }, [pathname]);

  useEffect(() => {
    // Trouver le conteneur scrollable (main dans workspace-layout)
    const scrollContainer = document.querySelector("main.overflow-y-auto");
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop;
          const scrollDelta = currentScrollY - lastScrollY.current;

          // Seuil de 10px pour éviter les micro-mouvements
          if (Math.abs(scrollDelta) > 10) {
            if (scrollDelta > 0 && currentScrollY > 100) {
              // Scroll vers le bas (après 100px) -> masquer
              setIsVisible(false);
            } else if (scrollDelta < 0) {
              // Scroll vers le haut -> afficher
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

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Toujours visible au changement de page
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden print:hidden",
        "transition-transform duration-300 ease-out",
        !isVisible && "translate-y-full"
      )}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
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
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] leading-tight",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
