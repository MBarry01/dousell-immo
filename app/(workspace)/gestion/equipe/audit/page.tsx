import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, History, User, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeamAuditLogs } from "../actions";
import type { TeamRole, TeamAuditLog } from "@/types/team";

export const metadata = {
  title: "Historique | Équipe - Dousell Immo",
  description: "Consultez l'historique des actions de l'équipe",
};

// Mapping des actions vers des labels lisibles
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "team.created": { label: "Équipe créée", color: "text-green-500" },
  "team.updated": { label: "Équipe modifiée", color: "text-blue-500" },
  "member.invited": { label: "Invitation envoyée", color: "text-amber-500" },
  "member.joined": { label: "Membre rejoint", color: "text-green-500" },
  "member.role_changed": { label: "Rôle modifié", color: "text-blue-500" },
  "member.removed": { label: "Membre retiré", color: "text-red-500" },
  "invitation.cancelled": { label: "Invitation annulée", color: "text-slate-400" },
  "settings.updated": { label: "Paramètres modifiés", color: "text-blue-500" },
};

export default async function AuditPage() {
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

  // Seuls owner et manager peuvent voir l'audit
  if (userRole !== "owner" && userRole !== "manager") {
    redirect("/gestion/equipe");
  }

  // Récupérer les logs
  const result = await getTeamAuditLogs(membership.team_id, 100);
  const logs = result.success ? result.logs || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-white">Historique d'activité</h1>
          <p className="text-sm text-slate-400">
            {logs.length} action{logs.length !== 1 ? "s" : ""} enregistrée
            {logs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Liste des logs */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-800">
          <History className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-lg font-medium text-slate-400 mb-1">
            Aucune activité
          </p>
          <p className="text-sm text-slate-500">
            L'historique des actions apparaîtra ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <AuditLogItem key={log.id} log={log} isLast={index === logs.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogItem({ log, isLast }: { log: TeamAuditLog; isLast: boolean }) {
  const actionConfig = ACTION_LABELS[log.action] || {
    label: log.action,
    color: "text-slate-400",
  };

  const createdAt = new Date(log.created_at);
  const dateStr = createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = createdAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Extraire les détails pertinents
  const details = getActionDetails(log);

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          <History className={`w-5 h-5 ${actionConfig.color}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-800 mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`font-medium ${actionConfig.color}`}>
              {actionConfig.label}
            </span>
            {log.resource_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                <Tag className="w-3 h-3 mr-1" />
                {log.resource_type}
              </span>
            )}
          </div>

          {details && (
            <p className="text-sm text-slate-400 mb-3">{details}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {log.user && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {log.user.full_name || log.user.email}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr} à {timeStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActionDetails(log: TeamAuditLog): string | null {
  const newData = log.new_data as Record<string, unknown> | null;
  const oldData = log.old_data as Record<string, unknown> | null;

  switch (log.action) {
    case "member.invited":
      return newData?.email
        ? `Invitation envoyée à ${newData.email} (${newData.role})`
        : null;

    case "member.joined":
      return newData?.role
        ? `A rejoint l'équipe en tant que ${newData.role}`
        : null;

    case "member.role_changed":
      return oldData?.role && newData?.role
        ? `Rôle changé de ${oldData.role} à ${newData.role}`
        : null;

    case "member.removed":
      const memberUser = oldData?.user as { full_name?: string; email?: string } | undefined;
      return memberUser?.full_name || memberUser?.email
        ? `${memberUser.full_name || memberUser.email} a été retiré de l'équipe`
        : null;

    case "team.updated":
      if (newData?.name) return `Nom modifié : ${newData.name}`;
      return "Paramètres de l'équipe modifiés";

    default:
      return null;
  }
}
