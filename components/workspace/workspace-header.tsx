"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut, Sun, Moon, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useMemo, Suspense } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { OwnerRoleSwitcher } from "@/components/workspace/OwnerRoleSwitcher";

interface WorkspaceHeaderProps {
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  onMenuClick?: () => void;
}

export function WorkspaceHeader({ user, onMenuClick }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();


  // Déterminer le titre selon le contexte
  const contextTitle = useMemo(() => {
    if (pathname?.startsWith("/gestion")) return "Gestion Locative";
    if (pathname?.startsWith("/locataire")) return "Espace Locataire";
    if (pathname?.startsWith("/admin")) return "Administration";
    return "Mon Compte";
  }, [pathname]);

  const userInitials = useMemo(() => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const handleSignOut = async () => {
    // Appeler l'API de déconnexion
    router.push("/auth/signout");
  };

  return (
    <header
      className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 transition-all pwa-header-safe"
    >
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left: Menu (mobile) + Logo + Retour site */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 -ml-1 text-foreground transition-transform duration-200 hover:scale-110 active:scale-95"
            onClick={onMenuClick}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          {/* Logo avec lien retour vitrine */}
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Image
              src="/icons/icon.svg"
              width={24}
              height={24}
              alt="Dousel"
              className="rounded-sm"
            />
          </Link>

          {/* Séparateur + Titre contexte */}
          <div className="hidden md:flex items-center gap-3">
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-primary">
              {contextTitle}
            </span>
          </div>
        </div>

        {/* Center: Search (desktop) - Functional */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <Suspense fallback={<div className="h-9 w-full bg-muted/50 rounded-md animate-pulse" />}>
            <GlobalSearch />
          </Suspense>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground transition-all duration-200 active:scale-95 hover:scale-110 hover:text-primary group"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-4 w-4 transition-colors group-hover:text-inherit" />
            ) : (
              <Moon className="h-4 w-4 transition-colors group-hover:text-inherit" />
            )}
            <span className="sr-only">Basculer le thème</span>
          </Button>

          {/* Notifications */}
          {/* Notifications component - handles dropdown & realtime */}
          <NotificationBell
            userId={user?.id || null}
            className="hover:scale-110 hover:text-primary transition-all duration-200 [&_svg]:transition-colors"
          />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.full_name || "Utilisateur"}
                  />
                  <AvatarFallback className="bg-slate-200 dark:bg-primary/10 text-slate-700 dark:text-primary text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/compte">Mon profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/compte/parametres">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Switch to tenant space if owner is also a tenant */}
              <OwnerRoleSwitcher />
              <DropdownMenuItem asChild>
                <Link href="/">Retour au site</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
