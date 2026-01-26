"use client";

import { Crown, UserCog, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions-config";
import type { TeamRole } from "@/types/team";

interface RoleBadgeProps {
  role: TeamRole;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const roleIcons: Record<TeamRole, React.ComponentType<{ className?: string }>> = {
  owner: Crown,
  manager: UserCog,
  accountant: Calculator,
  agent: User,
};

const sizeClasses = {
  sm: {
    badge: "px-2 py-0.5 text-xs gap-1",
    icon: "w-3 h-3",
  },
  md: {
    badge: "px-2.5 py-1 text-sm gap-1.5",
    icon: "w-4 h-4",
  },
  lg: {
    badge: "px-3 py-1.5 text-base gap-2",
    icon: "w-5 h-5",
  },
};

export function RoleBadge({
  role,
  size = "md",
  showLabel = true,
  className,
}: RoleBadgeProps) {
  const config = TEAM_ROLE_CONFIG[role];
  const Icon = roleIcons[role];
  const sizes = sizeClasses[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.textColor,
        sizes.badge,
        className
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function RoleDot({ role, className }: { role: TeamRole; className?: string }) {
  const config = TEAM_ROLE_CONFIG[role];

  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full", config.color, className)}
      title={config.label}
    />
  );
}
