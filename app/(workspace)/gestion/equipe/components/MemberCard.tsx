"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  UserCog,
  Trash2,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeTeamMember, leaveTeam } from "../actions";
import { toast } from "sonner";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import { RoleBadge } from "./RoleBadge";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import type { TeamMember, TeamRole } from "@/types/team";

interface MemberCardProps {
  member: TeamMember;
  teamId: string;
  currentUserRole: TeamRole;
  isCurrentUser: boolean;
}

export function MemberCard({
  member,
  teamId,
  currentUserRole,
  isCurrentUser,
}: MemberCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const canManage = currentUserRole === "owner" && !isCurrentUser;
  const canChangeRole = canManage && member.role !== "owner";
  const canRemove = canManage && member.role !== "owner";
  const canLeave = isCurrentUser && member.role !== "owner";

  const handleRemove = async () => {
    setLoading(true);
    const { data: result, error } = await removeTeamMember({ teamId, memberId: member.id });
    setLoading(false);

    if (result?.success) {
      toast.success("Membre retiré");
      setShowRemoveDialog(false);
      router.refresh();
    } else {
      toast.error(error || "Erreur");
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    const result = await leaveTeam(teamId);
    setLoading(false);

    if (result.success) {
      toast.success("Vous avez quitté l'équipe");
      router.push("/gestion");
    } else {
      toast.error(result.error || "Erreur");
    }
  };

  const initials = member.user?.full_name
    ? member.user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : member.user?.email?.slice(0, 2).toUpperCase() || "??";

  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : null;

  return (
    <>
      <div
        className={cn(
          "p-4 rounded-xl border transition-all duration-200",
          isDark
            ? "bg-slate-900 border-slate-800 hover:border-slate-700"
            : "bg-white border-gray-200 hover:border-gray-300",
          isCurrentUser && "ring-2 ring-[#F4C430]/30"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
              member.role === "owner"
                ? "bg-gradient-to-br from-[#F4C430] to-[#B8860B] text-black"
                : isDark
                  ? "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300"
                  : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600"
            )}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={cn(
                  "font-semibold truncate",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                {member.user?.full_name || "Utilisateur"}
              </h3>
              {isCurrentUser && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    isDark ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"
                  )}
                >
                  Vous
                </span>
              )}
            </div>

            <RoleBadge role={member.role} size="sm" className="mb-2" />

            <div
              className={cn(
                "space-y-1 text-sm",
                isDark ? "text-slate-400" : "text-gray-500"
              )}
            >
              {member.user?.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{member.user.email}</span>
                </div>
              )}
              {member.user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{member.user.phone}</span>
                </div>
              )}
              {joinedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Depuis le {joinedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {(canManage || canLeave) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isDark && "hover:bg-slate-800 text-slate-400"
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={cn(isDark && "bg-slate-800 border-slate-700")}
              >
                {canChangeRole && (
                  <DropdownMenuItem
                    onClick={() => setShowChangeRoleDialog(true)}
                    className={cn(isDark && "text-slate-200 focus:bg-slate-700")}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Changer le rôle
                  </DropdownMenuItem>
                )}
                {canRemove && (
                  <>
                    <DropdownMenuSeparator
                      className={cn(isDark && "bg-slate-700")}
                    />
                    <DropdownMenuItem
                      onClick={() => setShowRemoveDialog(true)}
                      className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Retirer de l&apos;équipe
                    </DropdownMenuItem>
                  </>
                )}
                {canLeave && (
                  <DropdownMenuItem
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Quitter l&apos;équipe
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Dialog de confirmation suppression */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent
          className={cn(isDark && "bg-slate-900 border-slate-700")}
        >
          <DialogHeader>
            <DialogTitle className={cn(isDark && "text-white")}>
              {isCurrentUser ? "Quitter l'équipe ?" : "Retirer ce membre ?"}
            </DialogTitle>
            <DialogDescription>
              {isCurrentUser
                ? "Vous perdrez l'accès aux biens et données de cette équipe."
                : `${member.user?.full_name || "Ce membre"} perdra l'accès aux biens et données de l'équipe.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              className={cn(isDark && "border-slate-700 text-slate-300")}
            >
              Annuler
            </Button>
            <Button
              onClick={isCurrentUser ? handleLeave : handleRemove}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de changement de rôle */}
      <ChangeRoleDialog
        member={member}
        teamId={teamId}
        open={showChangeRoleDialog}
        onOpenChange={setShowChangeRoleDialog}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
