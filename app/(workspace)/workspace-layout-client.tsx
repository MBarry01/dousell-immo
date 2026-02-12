"use client";

import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/components/workspace/providers/theme-provider";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { FadeIn } from "@/components/ui/fade-in";
import { WorkspaceBottomNav } from "@/components/workspace/workspace-bottom-nav";
import { switchTeam } from "@/app/actions/team-switching";
import { useState, Suspense } from "react";

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

  // Hydration Log
  useState(() => {
    console.log("[Workspace] ⚛️ React initialization started");
  });

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
        <main className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0 overscroll-contain bg-background">
          <Suspense fallback={<div className="p-6 animate-pulse bg-muted/20" />}>
            <div className="px-0 py-4 md:p-6 lg:pl-0">
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
