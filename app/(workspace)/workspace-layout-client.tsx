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

interface TeamData {
  id: string;
  name: string;
  slug: string;
  role: string;
  subscription_tier?: string;
}

interface WorkspaceLayoutClientProps {
  user: User;
  teams?: TeamData[];
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

  // Hydration Log
  useState(() => {
    console.log("[Workspace] ⚛️ React initialization started");
  });

  const isDistractionFree = pathname === "/compte/reset-password";

  if (isDistractionFree) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-[#05080c] text-white">
        <main className="flex-1 overflow-y-auto w-full flex items-center justify-center">
          <FadeIn delay={100} className="w-full">
            {children}
          </FadeIn>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Header - Full Width Top */}
      <WorkspaceHeader
        user={user}
        onMenuClick={() => setIsMobileOpen(true)}
      />

      {/* Content Row - Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <Suspense fallback={<div className="hidden lg:block w-16 bg-background border-r border-border" />}>
          <WorkspaceSidebar
            teams={teams}
            currentTeamId={currentTeamId || undefined}
            onSwitchTeam={switchTeam}
            isMobileOpen={isMobileOpen}
            onMobileOpenChange={setIsMobileOpen}
          />
        </Suspense>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          id="main-scroll-container"
          className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0 overscroll-contain bg-background"
        >
          <Suspense fallback={<div className="p-6 animate-pulse bg-muted/20" />}>
            <div className="w-full py-4 md:py-6">
              <FadeIn delay={100}>
                {children}
              </FadeIn>
            </div>
          </Suspense>
        </main>

      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <WorkspaceBottomNav />
      </Suspense>
    </div>
  );
}
