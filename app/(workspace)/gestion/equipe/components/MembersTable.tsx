"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, Trash2, Mail, LogOut, Clock, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { removeTeamMember, leaveTeam, cancelInvitation, resendInvitation } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TeamMember, TeamRole } from "@/types/team";

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  status: string;
}

interface MembersTableProps {
  members: TeamMember[];
  invitations?: TeamInvitation[];
  teamId: string;
  currentUserRole: TeamRole;
  currentUserId: string;
}

export function MembersTable({
  members,
  invitations = [],
  teamId,
  currentUserRole,
  currentUserId,
}: MembersTableProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [changeRoleMember, setChangeRoleMember] = useState<TeamMember | null>(null);

  const canManageRoles = currentUserRole === "owner";
  const canRemoveMembers = currentUserRole === "owner";
  const canManageInvitations = currentUserRole === "owner" || currentUserRole === "manager";

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;

    setIsLoading(memberId);
    const result = await removeTeamMember({ teamId, memberId });
    setIsLoading(null);

    if (result.data?.success) {
      toast.success("Membre retiré de l'équipe");
      router.refresh();
    } else {
      toast.error(result.error || result.data?.message || "Erreur lors de la suppression");
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Êtes-vous sûr de vouloir quitter cette équipe ?")) return;

    setIsLoading("leave");
    const result = await leaveTeam(teamId);
    setIsLoading(null);

    if (result.success) {
      toast.success("Vous avez quitté l'équipe");
      router.push("/gestion");
    } else {
      toast.error(result.error || "Erreur lors du départ");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setIsLoading(invitationId);
    const result = await cancelInvitation(teamId, invitationId);
    setIsLoading(null);

    if (result.success) {
      toast.success("Invitation annulée");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de l'annulation");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setIsLoading(invitationId);
    const result = await resendInvitation(teamId, invitationId);
    setIsLoading(null);

    if (result.success) {
      toast.success("Invitation renvoyée");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors du renvoi");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Invitations en attente */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className={cn(
              "text-sm font-semibold",
              isDark ? "text-slate-300" : "text-slate-700"
            )}>
              Invitations en attente ({invitations.length})
            </h3>
          </div>

          {/* Vue Mobile: Cartes Invitations */}
          <div className="md:hidden space-y-3">
            {invitations.map((inv) => {
              const roleConfig = TEAM_ROLE_CONFIG[inv.role as TeamRole];
              const isExpired = new Date(inv.expires_at) < new Date();

              return (
                <div
                  key={inv.id}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col gap-3",
                    isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200",
                    isLoading === inv.id && "opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                          <Mail className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                          {inv.email}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("mt-1", roleConfig?.bgColor, roleConfig?.textColor, "border-0")}
                        >
                          {roleConfig?.label || inv.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 border-border">
                    <span>Expire le {formatDate(inv.expires_at)}</span>
                    {canManageInvitations && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvitation(inv.id)}
                          disabled={isLoading === inv.id}
                          className="h-7 px-2 text-xs"
                        >
                          Renvoyer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                          disabled={isLoading === inv.id}
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue Desktop: Table Invitations */}
          <div className={cn(
            "hidden md:block rounded-lg border overflow-hidden",
            isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-amber-50/50"
          )}>
            <Table>
              <TableHeader>
                <TableRow className={isDark ? "border-slate-700" : "border-slate-200"}>
                  <TableHead className="w-[300px]">Email</TableHead>
                  <TableHead>Rôle proposé</TableHead>
                  <TableHead>Envoyée le</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const roleConfig = TEAM_ROLE_CONFIG[inv.role as TeamRole];
                  const isExpired = new Date(inv.expires_at) < new Date();

                  return (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        isDark ? "border-slate-700" : "border-slate-200",
                        isLoading === inv.id && "opacity-50"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                              <Mail className="h-3.5 w-3.5" />
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "text-sm",
                            isDark ? "text-slate-300" : "text-slate-700"
                          )}>
                            {inv.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(roleConfig?.bgColor, roleConfig?.textColor, "border-0")}
                        >
                          {roleConfig?.label || inv.role}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-sm",
                        isDark ? "text-slate-400" : "text-slate-600"
                      )}>
                        {formatDate(inv.created_at)}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-sm",
                          isExpired ? "text-red-500" : isDark ? "text-slate-400" : "text-slate-600"
                        )}>
                          {isExpired ? "Expirée" : formatDate(inv.expires_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageInvitations && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(inv.id)}
                              disabled={isLoading === inv.id}
                              className="text-xs"
                            >
                              Renvoyer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(inv.id)}
                              disabled={isLoading === inv.id}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Annuler
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Section Membres actifs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-500" />
          <h3 className={cn(
            "text-sm font-semibold",
            isDark ? "text-slate-300" : "text-slate-700"
          )}>
            Membres actifs ({members.length})
          </h3>
        </div>

        {/* Vue Mobile: Cartes Membres */}
        <div className="md:hidden space-y-3">
          {members.map((member) => {
            const user = member.user as { id: string; email: string; full_name: string; phone?: string } | undefined;
            const roleConfig = TEAM_ROLE_CONFIG[member.role as TeamRole];
            const isCurrentUser = member.user_id === currentUserId;
            const isOwner = member.role === "owner";

            return (
              <div
                key={member.id}
                className={cn(
                  "p-4 rounded-xl border flex items-start justify-between",
                  isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200",
                  isCurrentUser && (isDark ? "bg-primary/5" : "bg-primary/5"),
                  isLoading === member.id && "opacity-50"
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className={cn(
                      "text-sm font-medium",
                      roleConfig?.bgColor,
                      roleConfig?.textColor
                    )}>
                      {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={cn(
                        "font-medium",
                        isDark ? "text-slate-200" : "text-slate-800"
                      )}>
                        {user?.full_name || "Utilisateur"}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Vous
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm truncate max-w-[180px]",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {user?.email || "Email inconnu"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={cn(roleConfig?.bgColor, roleConfig?.textColor, "border-0 text-xs px-2 py-0.5")}
                      >
                        {roleConfig?.label || member.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mr-2"
                      disabled={isLoading === member.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Changer le rôle (owner only, pas sur soi-même ni sur owner) */}
                    {canManageRoles && !isCurrentUser && !isOwner && (
                      <DropdownMenuItem onSelect={() => setChangeRoleMember(member)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Changer le rôle
                      </DropdownMenuItem>
                    )}

                    {/* Supprimer membre (owner only, pas sur soi-même ni sur owner) */}
                    {canRemoveMembers && !isCurrentUser && !isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Retirer de l'équipe
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Quitter l'équipe (soi-même, pas owner) */}
                    {isCurrentUser && !isOwner && (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={handleLeaveTeam}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Quitter l'équipe
                      </DropdownMenuItem>
                    )}

                    {(!canManageRoles && !isCurrentUser && !isOwner) || (isOwner && !isCurrentUser) ? (
                      <DropdownMenuItem disabled>
                        <span className="text-slate-400 text-xs">
                          Aucune action disponible
                        </span>
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        {/* Vue Desktop: Table Membres */}
        <div className={cn(
          "hidden md:block rounded-lg border overflow-hidden",
          isDark ? "border-slate-700" : "border-slate-200"
        )}>
          <Table>
            <TableHeader>
              <TableRow className={isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}>
                <TableHead className="w-[300px]">Membre</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Membre depuis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const user = member.user as { id: string; email: string; full_name: string; phone?: string } | undefined;
                const roleConfig = TEAM_ROLE_CONFIG[member.role as TeamRole];
                const isCurrentUser = member.user_id === currentUserId;
                const isOwner = member.role === "owner";

                return (
                  <TableRow
                    key={member.id}
                    className={cn(
                      isDark ? "border-slate-700" : "border-slate-200",
                      isCurrentUser && (isDark ? "bg-primary/5" : "bg-primary/5"),
                      isLoading === member.id && "opacity-50"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={cn(
                            "text-sm font-medium",
                            roleConfig?.bgColor,
                            roleConfig?.textColor
                          )}>
                            {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium",
                              isDark ? "text-slate-200" : "text-slate-800"
                            )}>
                              {user?.full_name || "Utilisateur"}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Vous
                              </Badge>
                            )}
                          </div>
                          <span className={cn(
                            "text-xs",
                            isDark ? "text-slate-400" : "text-slate-500"
                          )}>
                            {user?.email || "Email inconnu"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(roleConfig?.bgColor, roleConfig?.textColor, "border-0")}
                      >
                        {roleConfig?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-sm",
                      isDark ? "text-slate-400" : "text-slate-600"
                    )}>
                      {user?.phone || "—"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-sm",
                      isDark ? "text-slate-400" : "text-slate-600"
                    )}>
                      {member.joined_at ? formatDate(member.joined_at) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isLoading === member.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Changer le rôle (owner only, pas sur soi-même ni sur owner) */}
                          {canManageRoles && !isCurrentUser && !isOwner && (
                            <DropdownMenuItem onSelect={() => setChangeRoleMember(member)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Changer le rôle
                            </DropdownMenuItem>
                          )}

                          {/* Supprimer membre (owner only, pas sur soi-même ni sur owner) */}
                          {canRemoveMembers && !isCurrentUser && !isOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Retirer de l'équipe
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Quitter l'équipe (soi-même, pas owner) */}
                          {isCurrentUser && !isOwner && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={handleLeaveTeam}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Quitter l'équipe
                            </DropdownMenuItem>
                          )}

                          {/* Si aucune action disponible (pour les non-admins voyant d'autres membres) */}
                          {(!canManageRoles && !isCurrentUser && !isOwner) || (isOwner && !isCurrentUser) ? (
                            <DropdownMenuItem disabled>
                              <span className="text-slate-400 text-xs">
                                Aucune action disponible
                              </span>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog pour changer le rôle */}
      {changeRoleMember && (
        <ChangeRoleDialog
          member={changeRoleMember}
          teamId={teamId}
          open={!!changeRoleMember}
          onOpenChange={(open) => {
            if (!open) setChangeRoleMember(null);
          }}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
