"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceTeamData } from "@/types/team";

interface TeamSwitcherProps {
  teams: WorkspaceTeamData[];
  currentTeamId: string;
  onSwitchTeam?: (teamId: string) => Promise<void>;
  isCollapsed?: boolean;
  className?: string;
}

export function TeamSwitcher({
  teams,
  currentTeamId,
  onSwitchTeam,
  isCollapsed = false,
  className,
}: TeamSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const currentTeam = teams.find((t) => t.id === currentTeamId);

  const handleSwitch = async (newTeamId: string) => {
    if (newTeamId === "create") {
      router.push("/gestion/equipe?action=create");
      return;
    }

    if (newTeamId === currentTeamId) return;

    startTransition(async () => {
      if (onSwitchTeam) {
        await onSwitchTeam(newTeamId);
      }
      router.refresh();
    });
  };

  // Mode collapsed - juste l'icône
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-2 rounded-lg cursor-pointer",
          "bg-primary/5 hover:bg-primary/10 transition-colors",
          className
        )}
        title={currentTeam?.name || "Mon équipe"}
      >
        {currentTeam?.slug.startsWith("perso-") ? (
          <User className="h-5 w-5 text-primary" />
        ) : (
          <Building2 className="h-5 w-5 text-primary" />
        )}
      </div>
    );
  }

  // Si une seule équipe, affichage simple sans dropdown
  if (teams.length <= 1) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          "bg-primary/5 border border-primary/10",
          className
        )}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
          {currentTeam?.slug.startsWith("perso-") ? (
            <User className="h-4 w-4 text-primary" />
          ) : (
            <Building2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentTeam?.name || "Mon équipe"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {getRoleLabel(currentTeam?.role || "owner")}
          </p>
        </div>
      </div>
    );
  }

  // Mode multi-équipes avec dropdown
  return (
    <Select
      value={currentTeamId}
      onValueChange={handleSwitch}
      open={isOpen}
      onOpenChange={setIsOpen}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          "w-full h-auto p-2 border-none bg-transparent hover:bg-primary/5 transition-colors",
          "focus:ring-0 focus:ring-offset-0",
          isPending && "opacity-50 cursor-wait",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 shrink-0">
            {currentTeam?.slug.startsWith("perso-") ? (
              <User className="h-4 w-4 text-primary" />
            ) : (
              <Building2 className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">
              {currentTeam?.name || "Sélectionner..."}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {getRoleLabel(currentTeam?.role || "owner")}
            </p>
          </div>
        </div>
      </SelectTrigger>

      <SelectContent align="start" className="w-[--radix-select-trigger-width] min-w-[220px]">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Mes Espaces
        </div>

        {teams.map((team) => (
          <SelectItem
            key={team.id}
            value={team.id}
            className="cursor-pointer py-2 group focus:bg-[#0F172A] focus:text-white"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0 group-focus:bg-white/10 transition-colors">
                {team.slug.startsWith("perso-") ? (
                  <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 group-focus:text-white" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 group-focus:text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-focus:text-white">{team.name}</p>
                <p className="text-xs text-muted-foreground capitalize group-focus:text-white/70">
                  {getRoleLabel(team.role)}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}

        <div className="h-px bg-border my-1" />

        <SelectItem
          value="create"
          className="cursor-pointer font-medium py-2 group focus:bg-[#0F172A] focus:text-white"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary group-focus:text-white" />
            <span className="text-primary group-focus:text-white">Créer un nouvel espace</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Propriétaire",
    manager: "Gestionnaire",
    accountant: "Comptable",
    agent: "Agent",
  };
  return labels[role] || role;
}
