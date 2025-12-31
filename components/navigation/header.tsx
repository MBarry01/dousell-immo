"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserNav } from "@/components/layout/user-nav";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/recherche", label: "Annonce" },
  { href: "/a-propos", label: "À propos" },
  { href: "/planifier-visite", label: "Contact" },
];

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const scrollY = useScrollPosition();

  const isActiveLink = useMemo(
    () => (href: string) => pathname === href,
    [pathname]
  );

  // Déterminer si le header doit être transparent ou avec glassmorphism
  const isScrolled = scrollY > 10;

  return (
    <>
      {/* Version Mobile */}
      <header
        suppressHydrationWarning
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 transition-all duration-300 md:hidden print:hidden",
          isScrolled
            ? "bg-black/80 backdrop-blur-md border-b border-white/5"
            : "bg-transparent border-transparent"
        )}
        style={{
          height: "calc(env(safe-area-inset-top, 0px) + 4rem)",
          minHeight: "calc(env(safe-area-inset-top, 0px) + 4rem)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          willChange: "transform",
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <div className="flex h-16 w-full items-center justify-between">
          <Link
            href="/"
            className="flex items-center transition-opacity active:opacity-70 hover:opacity-80"
            aria-label="Dousell Immo - Accueil"
          >
            <Image
              src="/Logo.svg"
              alt="Dousell Immo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Actions droite - Connecté */}
          {!loading && user && (
            <div className="flex items-center gap-2">
              <Link
                id="tour-home-add-mobile"
                href="/compte/deposer"
                className="relative flex items-center justify-center rounded-full p-2.5 transition-all active:scale-95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Déposer une annonce"
              >
                <Plus className="h-5 w-5 text-white" />
              </Link>
              <NotificationBell userId={user.id} />
              {/* Menu utilisateur avec avatar */}
              <div id="tour-home-menu-mobile" className="relative" style={{ zIndex: 2 }}>
                <UserNav />
              </div>
            </div>
          )}

          {/* Bouton "Se connecter" si non connecté */}
          {!loading && !user && (
            <Button
              size="sm"
              className="rounded-xl px-4 text-sm transition-all hover:scale-105 active:scale-95"
              onClick={() => router.push("/login")}
            >
              Se connecter
            </Button>
          )}

          {/* Placeholder pendant le chargement */}
          {loading && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          )}
        </div>
      </header>

      {/* Version Desktop */}
      <header
        className="sticky top-0 z-40 hidden w-full md:block print:hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between rounded-[32px] border border-white/5 px-6 py-3.5 shadow-lg shadow-black/20 lg:px-8 lg:py-4 relative">
          <Link
            href="/"
            className="flex items-center transition-opacity active:opacity-70 hover:opacity-80"
            aria-label="Dousell Immo - Accueil"
          >
            <Image
              src="/Logo.svg"
              alt="Dousell Immo"
              width={240}
              height={80}
              className="h-11 w-auto transition-transform hover:scale-105 lg:h-14"
              priority
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-white/70 lg:gap-6">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  id={link.label === "Annonce" ? "tour-home-nav-search-desktop" : undefined}
                  href={link.href}
                  className={cn(
                    "relative transition-colors duration-200 hover:text-white",
                    isActive && "text-white"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2.5 lg:gap-3">
            {!loading && user && (
              <>
                <Link
                  id="tour-home-add-desktop"
                  href="/compte/deposer"
                  className="relative flex items-center justify-center rounded-full p-2 transition-all active:scale-95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="Déposer une annonce"
                  style={{ zIndex: 1 }}
                >
                  <Plus className="h-4 w-4 text-white" />
                </Link>
                <div className="relative" style={{ zIndex: 1 }}>
                  <NotificationBell userId={user.id} />
                </div>
              </>
            )}
            <div id="tour-home-menu-desktop" className="relative" style={{ zIndex: 2 }}>
              <UserNav />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};







