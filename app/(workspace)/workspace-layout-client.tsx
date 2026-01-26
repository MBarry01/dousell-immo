"use client";

import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/components/workspace/providers/theme-provider";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { FadeIn } from "@/components/ui/fade-in";
import { WorkspaceBottomNav } from "@/components/workspace/workspace-bottom-nav";

interface WorkspaceLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

export function WorkspaceLayoutClient({ user, children }: WorkspaceLayoutClientProps) {
  return (
    <ThemeProvider>

      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {/* Header - Full Width Top */}
        <WorkspaceHeader user={user} />

        {/* Content Row - Sidebar + Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Desktop */}
          <WorkspaceSidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-safe-nav lg:pb-0">
            <div className="h-full p-4 md:p-6 lg:pl-0">
              <FadeIn delay={100} className="h-full">
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
