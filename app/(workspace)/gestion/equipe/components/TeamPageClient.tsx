"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Shield, Settings, UserPlus, Building2, BarChart3, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions";
import { MembersTable } from "./MembersTable";
import { RolePermissionsTable } from "./RolePermissionsTable";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { AccessControlTab } from "./AccessControlTab";
import type { Team, TeamMember, TeamRole, TeamStats } from "@/types/team";
import { EquipeTour } from '@/components/gestion/tours/EquipeTour';

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  status: string;
}

interface TeamPageClientProps {
  team: Team;
  members: TeamMember[];
  invitations: TeamInvitation[];
  stats?: TeamStats;
  currentUserId: string;
  currentUserRole: TeamRole;
}

export function TeamPageClient({
  team,
  members,
  invitations,
  stats,
  currentUserId,
  currentUserRole,
}: TeamPageClientProps) {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  // Initialiser avec l'onglet de l'URL ou "members" par défaut
  const [activeTab, setActiveTab] = useState(tabFromUrl || "members");

  const canInvite = currentUserRole === "owner" || currentUserRole === "manager";
  const roleConfig = TEAM_ROLE_CONFIG[currentUserRole];

  // Mettre à jour l'onglet si le paramètre URL change
  useEffect(() => {
    if (tabFromUrl && ["members", "permissions", "access-control"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="space-y-4 px-4 lg:space-y-6 lg:px-8">
      <EquipeTour />
      {/* En-tête de la page */}
      <div id="tour-team-header" className={cn(
        "rounded-2xl p-4 md:p-6",
        isDark
          ? "bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700"
          : "bg-gradient-to-r from-slate-100 to-white border border-slate-200"
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          {/* Infos équipe */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-xl overflow-hidden shadow-sm shrink-0",
              team.logo_url ? "bg-white p-1.5 border border-slate-200" : (isDark ? "bg-primary/20" : "bg-primary/10")
            )}>
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="h-full w-auto max-w-full object-contain"
                />
              ) : (
                <Building2 className="h-7 w-7 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className={cn(
                  "text-lg md:text-xl font-bold line-clamp-1",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {team.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(roleConfig.bgColor, roleConfig.textColor, "border-0")}
                >
                  {roleConfig.label}
                </Badge>
              </div>
              <p className={cn(
                "text-sm mt-0.5",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                {team.description || "Gérez votre équipe et ses permissions"}
              </p>
            </div>
          </div>

          {/* Stats rapides + Action */}
          <div className="flex items-center gap-4">
            {stats && (
              <div id="tour-team-stats" className="hidden sm:flex items-center gap-4">
                <StatBadge
                  icon={<Users className="h-4 w-4" />}
                  value={stats.total_members}
                  label="Membres"
                  isDark={isDark}
                  onClick={() => setActiveTab("members")}
                />
                {stats.pending_invitations > 0 && (
                  <StatBadge
                    icon={<UserPlus className="h-4 w-4" />}
                    value={stats.pending_invitations}
                    label="En attente"
                    variant="warning"
                    isDark={isDark}
                    onClick={() => setActiveTab("members")}
                  />
                )}
                <StatBadge
                  icon={<BarChart3 className="h-4 w-4" />}
                  value={stats.active_leases}
                  label="Baux actifs"
                  isDark={isDark}
                  href="/gestion"
                />
              </div>
            )}

            {canInvite && (
              <InviteMemberDialog
                teamId={team.id}
                trigger={
                  <Button id="tour-team-invite" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inviter
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs id="tour-team-tabs" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start md:justify-center bg-transparent p-1 gap-1 md:gap-2 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-full overflow-x-auto overflow-y-hidden scrollbar-none">
          <TabsTrigger
            value="members"
            className="group rounded-full border border-transparent data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 transition-all flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm"
          >
            <Users className="h-4 w-4 transition-colors" />
            <span className="font-medium transition-colors">Membres</span>
            {(members.length + invitations.length) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-slate-100/80 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400 border-none">
                {members.length + invitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="group rounded-full border border-transparent data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 transition-all flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm"
          >
            <Shield className="h-4 w-4 transition-colors" />
            <span className="font-medium transition-colors">Rôles & Permissions</span>
          </TabsTrigger>
          {canInvite && (
            <TabsTrigger
              value="access-control"
              className="group rounded-full border border-transparent data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 transition-all flex items-center gap-2 px-4 py-2"
            >
              <KeyRound className="h-4 w-4 transition-colors" />
              <span className="font-medium transition-colors">Accès Temporaire</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Membres */}
        <TabsContent value="members" className="mt-0">
          <MembersTable
            members={members}
            invitations={invitations}
            teamId={team.id}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* Tab: Permissions */}
        <TabsContent value="permissions" className="mt-0">
          <RolePermissionsTable currentUserRole={currentUserRole} />
        </TabsContent>

        {/* Tab: Accès Temporaire (owners/managers uniquement) */}
        {canInvite && (
          <TabsContent value="access-control" className="mt-0">
            <AccessControlTab teamId={team.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface StatBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  variant?: "default" | "warning";
  isDark: boolean;
  href?: string;
  onClick?: () => void;
}

function StatBadge({ icon, value, label, variant = "default", isDark, href, onClick }: StatBadgeProps) {
  const content = (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 text-left",
      variant === "warning"
        ? isDark ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-200"
        : isDark ? "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm"
    )}>
      {icon}
      <div className="flex items-center gap-1.5 ml-1 whitespace-nowrap">
        <span className="text-sm font-semibold leading-none">{value}</span>
        <span className="text-xs opacity-70 font-medium">{label}</span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button onClick={onClick} className="block w-full focus:outline-none">
      {content}
    </button>
  );
}
