"use client";

import { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/components/workspace/providers/theme-provider";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";

interface WorkspaceLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

export function WorkspaceLayoutClient({ user, children }: WorkspaceLayoutClientProps) {
  return (
    <ThemeProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        {/* Sidebar Desktop */}
        <WorkspaceSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <WorkspaceHeader user={user} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="h-full p-4 md:p-6 lg:pl-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
