"use client";

import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/components/workspace/providers/theme-provider";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { FadeIn } from "@/components/ui/fade-in";
import { WorkspaceBottomNav } from "@/components/workspace/workspace-bottom-nav";
import { switchTeam } from "@/app/actions/team-switching";
import { useState } from "react";

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

  return (
    <ThemeProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {/* Header - Full Width Top */}
        <WorkspaceHeader
          user={user}
          onMenuClick={() => setIsMobileOpen(true)}
        />

        {/* Content Row - Sidebar + Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Desktop */}
          <WorkspaceSidebar
            teams={teams}
            currentTeamId={currentTeamId || undefined}
            onSwitchTeam={switchTeam}
            isMobileOpen={isMobileOpen}
            onMobileOpenChange={setIsMobileOpen}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0 overscroll-contain">
            <div className="p-4 md:p-6 lg:pl-0">
              <FadeIn delay={100}>
                {children}
              </FadeIn>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <WorkspaceBottomNav />
      </div>
    </ThemeProvider>
  );
}
