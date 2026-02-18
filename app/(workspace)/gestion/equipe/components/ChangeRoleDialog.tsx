"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole } from "../actions";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { TEAM_ROLE_CONFIG, INVITABLE_ROLES } from "@/lib/team-permissions-config";
import type { TeamMember, TeamRole } from "@/types/team";
import { RoleBadge } from "./RoleBadge";

interface ChangeRoleDialogProps {
  member: TeamMember;
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ChangeRoleDialog({
  member,
  teamId,
  open,
  onOpenChange,
  onSuccess,
}: ChangeRoleDialogProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<Exclude<TeamRole, "owner">>(
    member.role === "owner" ? "manager" : (member.role as Exclude<TeamRole, "owner">)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newRole === member.role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);

    const { data: result, error } = await changeMemberRole({
      teamId,
      memberId: member.id,
      newRole,
    });

    setLoading(false);

    if (result?.success) {
      toast.success(result.message || "Rôle modifié");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(error || "Erreur");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          isDark ? "bg-slate-900 border-slate-700" : "bg-white"
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(isDark ? "text-white" : "text-gray-900")}>
            Changer le rôle
          </DialogTitle>
          <DialogDescription>
            Modifier le rôle de {member.user?.full_name || "ce membre"} dans
            l&apos;équipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Rôle actuel */}
          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            >
              Rôle actuel
            </label>
            <div className="flex items-center gap-2">
              <RoleBadge role={member.role} />
            </div>
          </div>

          {/* Nouveau rôle */}
          <div>
            <label
              className={cn(
                "text-sm font-medium mb-1.5 block",
                isDark ? "text-slate-300" : "text-gray-700"
              )}
            >
              Nouveau rôle
            </label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
              <SelectTrigger
                className={cn(isDark && "bg-slate-800 border-slate-700 text-white")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(isDark && "bg-slate-800 border-slate-700")}>
                {INVITABLE_ROLES.map((r) => (
                  <SelectItem
                    key={r}
                    value={r}
                    className={cn(isDark && "text-white focus:bg-slate-700")}
                  >
                    <div className="flex items-center gap-2">
                      <RoleBadge role={r} size="sm" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aperçu du rôle */}
          {newRole !== member.role && (
            <div
              className={cn(
                "p-3 rounded-lg border",
                isDark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-slate-300" : "text-gray-600"
                )}
              >
                <strong>{member.user?.full_name || "Ce membre"}</strong> aura
                les permissions de{" "}
                <span className={TEAM_ROLE_CONFIG[newRole].textColor}>
                  {TEAM_ROLE_CONFIG[newRole].label}
                </span>
                .
              </p>
              <p
                className={cn(
                  "text-xs mt-1",
                  isDark ? "text-slate-400" : "text-gray-500"
                )}
              >
                {TEAM_ROLE_CONFIG[newRole].description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(isDark && "border-slate-700 text-slate-300 hover:bg-slate-800")}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || newRole === member.role}
              className="bg-[#F4C430] hover:bg-[#B8860B] text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
