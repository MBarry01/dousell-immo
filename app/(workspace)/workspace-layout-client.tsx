"use client";

import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { FadeIn } from "@/components/ui/fade-in";
import { WorkspaceBottomNav } from "@/components/workspace/workspace-bottom-nav";
import { switchTeam } from "@/app/actions/team-switching";
import { useState, Suspense, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToTop } from "@/lib/scroll-utils";
import type { WorkspaceTeamData } from "@/types/team";
import { cn } from "@/lib/utils";

interface WorkspaceLayoutClientProps {
  user: User;
  teams?: WorkspaceTeamData[];
  currentTeamId?: string | null;
  children: React.ReactNode;
}

export function WorkspaceLayoutClient({
  user,
  teams = [],
  currentTeamId,
  children,
}: WorkspaceLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll to top on navigation
  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  const isDistractionFree = pathname === "/compte/reset-password";

  return (
    <div className={cn(
      "flex h-dvh flex-col overflow-hidden",
      isDistractionFree ? "bg-[#05080c] text-white" : "bg-background text-foreground"
    )}>
      {/* Header - Uniquement si hors distraction */}
      {!isDistractionFree && (
        <WorkspaceHeader
          user={user}
          onMenuClick={() => setIsMobileOpen(true)}
        />
      )}

      {/* Content Row - Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop - Uniquement si hors distraction */}
        {!isDistractionFree && (
          <Suspense fallback={<div className="hidden lg:block w-16 bg-background border-r border-border" />}>
            <WorkspaceSidebar
              user={user}
              teams={teams}
              currentTeamId={currentTeamId || undefined}
              onSwitchTeam={switchTeam}
              isMobileOpen={isMobileOpen}
              onMobileOpenChange={setIsMobileOpen}
            />
          </Suspense>
        )}

        {/* Main Content Area */}
        <main
          ref={mainRef}
          id="main-scroll-container"
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            !isDistractionFree ? "pb-safe-nav lg:pb-0 bg-background" : "w-full flex items-center justify-center"
          )}
        >
          <Suspense fallback={<div className="p-6 animate-pulse bg-muted/20" />}>
            <div className="w-full h-full flex flex-col">
              <FadeIn
                delay={100}
                noTransform={pathname?.includes("/messages") || isDistractionFree}
                className={isDistractionFree ? "w-full" : "flex-1 flex flex-col"}
              >
                {children}
              </FadeIn>
            </div>
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Uniquement si hors distraction */}
      {!isDistractionFree && (
        <Suspense fallback={null}>
          <WorkspaceBottomNav />
        </Suspense>
      )}
    </div>
  );
}
