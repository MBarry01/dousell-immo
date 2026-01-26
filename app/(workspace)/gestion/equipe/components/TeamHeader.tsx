"use client";

import { Building2, Users, Mail, Clock, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import { RoleBadge } from "./RoleBadge";
import { InviteMemberDialog } from "./InviteMemberDialog";
import type { Team, TeamRole, TeamStats } from "@/types/team";

interface TeamHeaderProps {
  team: Team;
  userRole: TeamRole;
  stats?: TeamStats;
}

export function TeamHeader({ team, userRole, stats }: TeamHeaderProps) {
  const { isDark } = useTheme();
  const canInvite = userRole === "owner" || userRole === "manager";
  const canManageSettings = userRole === "owner";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Info équipe */}
        <div className="flex items-start gap-4">
          {/* Logo/Avatar */}
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
              team.logo_url
                ? ""
                : "bg-gradient-to-br from-[#F4C430] to-[#B8860B]"
            )}
          >
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <Building2 className="w-8 h-8 text-black" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1
                className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {team.name}
              </h1>
              <RoleBadge role={userRole} size="sm" />
            </div>

            {team.description && (
              <p
                className={cn(
                  "text-sm mb-2",
                  isDark ? "text-slate-400" : "text-gray-500"
                )}
              >
                {team.description}
              </p>
            )}

            <div
              className={cn(
                "flex flex-wrap items-center gap-4 text-sm",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            >
              {stats && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {stats.total_members} membre{stats.total_members > 1 ? "s" : ""}
                </span>
              )}
              {team.company_email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {team.company_email}
                </span>
              )}
              {stats?.pending_invitations ? (
                <span className="flex items-center gap-1.5 text-amber-500">
                  <Clock className="w-4 h-4" />
                  {stats.pending_invitations} invitation
                  {stats.pending_invitations > 1 ? "s" : ""} en attente
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canInvite && <InviteMemberDialog teamId={team.id} />}

          {canManageSettings && (
            <Link href="/gestion/equipe/parametres">
              <Button
                variant="outline"
                className={cn(
                  isDark && "border-slate-700 text-slate-300 hover:bg-slate-800"
                )}
              >
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <StatCard
            label="Membres"
            value={stats.total_members}
            isDark={isDark}
          />
          <StatCard
            label="Baux actifs"
            value={stats.active_leases}
            isDark={isDark}
          />
          <StatCard
            label="Total baux"
            value={stats.total_leases}
            isDark={isDark}
          />
          <StatCard
            label="Invitations"
            value={stats.pending_invitations}
            isDark={isDark}
            highlight={stats.pending_invitations > 0}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  isDark,
  highlight = false,
}: {
  label: string;
  value: number;
  isDark: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl",
        isDark ? "bg-slate-800/50" : "bg-gray-50"
      )}
    >
      <p
        className={cn(
          "text-xs mb-1",
          isDark ? "text-slate-400" : "text-gray-500"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold",
          highlight
            ? "text-amber-500"
            : isDark
              ? "text-white"
              : "text-gray-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
