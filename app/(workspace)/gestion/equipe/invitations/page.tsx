import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Clock, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeamInvitations, cancelInvitation } from "../actions";
import { TEAM_ROLE_CONFIG } from "@/lib/team-permissions-config";
import type { TeamRole, TeamInvitation } from "@/types/team";
import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { CancelInvitationButton } from "./CancelInvitationButton";

export const metadata = {
  title: "Invitations | Équipe - Dousell Immo",
  description: "Gérez les invitations en attente",
};

export default async function InvitationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Récupérer le membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) redirect("/gestion/equipe");

  const userRole = membership.role as TeamRole;
  const canInvite = userRole === "owner" || userRole === "manager";

  // Récupérer les invitations
  const result = await getTeamInvitations(membership.team_id);
  const invitations = result.success ? result.invitations || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/gestion/equipe">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Invitations</h1>
            <p className="text-sm text-slate-400">
              {invitations.length} invitation
              {invitations.length !== 1 ? "s" : ""} en attente
            </p>
          </div>
        </div>

        {canInvite && <InviteMemberDialog teamId={membership.team_id} />}
      </div>

      {/* Liste des invitations */}
      {invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-800">
          <Mail className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-lg font-medium text-slate-400 mb-1">
            Aucune invitation en attente
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Invitez des collaborateurs pour agrandir votre équipe
          </p>
          {canInvite && <InviteMemberDialog teamId={membership.team_id} />}
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              teamId={membership.team_id}
              canManage={canInvite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({
  invitation,
  teamId,
  canManage,
}: {
  invitation: TeamInvitation;
  teamId: string;
  canManage: boolean;
}) {
  const roleConfig = TEAM_ROLE_CONFIG[invitation.role as TeamRole];
  const expiresAt = new Date(invitation.expires_at);
  const isExpiringSoon =
    expiresAt.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000; // 2 jours

  const createdAt = new Date(invitation.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const expiresIn = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-slate-400" />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{invitation.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.textColor}`}
              >
                {roleConfig.label}
              </span>
              <span className="text-xs text-slate-500">
                Invité le {createdAt}
              </span>
            </div>

            {invitation.message && (
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                "{invitation.message}"
              </p>
            )}

            {/* Expiration */}
            <div
              className={`flex items-center gap-1.5 mt-2 text-xs ${
                isExpiringSoon ? "text-amber-500" : "text-slate-500"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {expiresIn > 0
                  ? `Expire dans ${expiresIn} jour${expiresIn > 1 ? "s" : ""}`
                  : "Expirée"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <CancelInvitationButton
            teamId={teamId}
            invitationId={invitation.id}
          />
        )}
      </div>
    </div>
  );
}
