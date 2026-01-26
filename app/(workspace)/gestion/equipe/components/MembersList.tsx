"use client";

import { Users } from "lucide-react";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import { MemberCard } from "./MemberCard";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions-config";
import type { TeamMember, TeamRole } from "@/types/team";

interface MembersListProps {
  members: TeamMember[];
  teamId: string;
  currentUserRole: TeamRole;
  currentUserId: string;
}

export function MembersList({
  members,
  teamId,
  currentUserRole,
  currentUserId,
}: MembersListProps) {
  const { isDark } = useTheme();

  // Grouper les membres par rôle
  const membersByRole = members.reduce(
    (acc, member) => {
      const role = member.role as TeamRole;
      if (!acc[role]) acc[role] = [];
      acc[role].push(member);
      return acc;
    },
    {} as Record<TeamRole, TeamMember[]>
  );

  // Ordre d'affichage des rôles
  const roleOrder: TeamRole[] = ["owner", "manager", "accountant", "agent"];

  if (members.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed",
          isDark ? "border-slate-800" : "border-gray-200"
        )}
      >
        <Users
          className={cn(
            "w-12 h-12 mb-4",
            isDark ? "text-slate-600" : "text-gray-300"
          )}
        />
        <p
          className={cn(
            "text-lg font-medium mb-1",
            isDark ? "text-slate-400" : "text-gray-500"
          )}
        >
          Aucun membre
        </p>
        <p
          className={cn(
            "text-sm",
            isDark ? "text-slate-500" : "text-gray-400"
          )}
        >
          Invitez des collaborateurs pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roleOrder.map((role) => {
        const roleMembers = membersByRole[role];
        if (!roleMembers || roleMembers.length === 0) return null;

        const config = TEAM_ROLE_CONFIG[role];

        return (
          <div key={role}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  config.color
                )}
              />
              <h2
                className={cn(
                  "text-sm font-semibold uppercase tracking-wider",
                  isDark ? "text-slate-400" : "text-gray-500"
                )}
              >
                {config.label}s ({roleMembers.length})
              </h2>
            </div>

            {/* Members grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roleMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  teamId={teamId}
                  currentUserRole={currentUserRole}
                  isCurrentUser={member.user_id === currentUserId}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
