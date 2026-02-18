"use client";

/**
 * TemporaryAccessWidget - Widget pour afficher les permissions temporaires actives
 *
 * Affiche dans la sidebar:
 * - Badge avec nombre de permissions actives
 * - Liste déroulante des permissions avec temps restant (hh:mm)
 * - Lien vers l'onglet Accès Temporaire de la page Équipe
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  KeyRound,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  MousePointerClick,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TemporaryPermission {
  id: string;
  permission: string;
  expires_at: string;
  granted_by: string;
  reason?: string;
}

/**
 * Widget des permissions temporaires pour la sidebar
 */
export function TemporaryAccessWidget({
  collapsed = false,
  teamId
}: {
  collapsed?: boolean;
  teamId?: string;
}) {
  const [permissions, setPermissions] = useState<TemporaryPermission[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const supabase = createClient();

        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        let targetTeamId = teamId;

        // Si pas de teamId fourni, essayer de le deviner (comportement legacy)
        if (!targetTeamId) {
          const { data: teamMember } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          targetTeamId = teamMember?.team_id;
        }

        if (!targetTeamId) {
          setIsLoading(false);
          return;
        }

        // Récupérer les permissions temporaires
        const { data } = await supabase.rpc("get_active_temporary_permissions", {
          p_team_id: targetTeamId,
          p_user_id: user.id,
        });

        setPermissions(data || []);
      } catch (error) {
        console.error("[TemporaryAccessWidget] Error loading permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadPermissions, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;
  if (permissions.length === 0) return null;

  // Mode collapsed (sidebar rétractée)
  if (collapsed) {
    return (
      <div className="px-2 py-2">
        <div
          className="relative flex items-center justify-center w-full h-10 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
          title={`${permissions.length} permission(s) temporaire(s)`}
        >
          <KeyRound size={20} className="text-amber-700 dark:text-amber-400" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-600 dark:bg-amber-500 rounded-full shadow-sm border border-white dark:border-transparent">
            {permissions.length}
          </span>
        </div>
      </div>
    );
  }

  // Mode étendu
  return (
    <div className="px-3 py-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-amber-700 dark:text-amber-400" />
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
            Accès temporaires
          </span>
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-600 dark:bg-amber-500 rounded-full">
            {permissions.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-zinc-600 dark:text-zinc-400" />
        ) : (
          <ChevronDown size={16} className="text-zinc-600 dark:text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {permissions.map((perm) => (
            <PermissionItem key={perm.id} permission={perm} />
          ))}

          {/* Indice pour demander un accès */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/30">
            <MousePointerClick size={14} className="text-zinc-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-zinc-600 dark:text-zinc-500 leading-tight">
              Cliquez sur un accès ci-dessus pour y accéder, ou sur une section <Lock size={10} className="inline text-amber-500" /> pour en demander un nouveau
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Retourne l'URL de la section correspondant à la permission
 */
function getPermissionUrl(permission: string): string {
  const prefix = permission.split(".")[0];
  const urlMap: Record<string, string> = {
    properties: "/gestion/biens",
    leases: "/gestion", // Baux dans le dashboard principal
    tenants: "/gestion", // Locataires dans le dashboard principal
    payments: "/gestion/comptabilite",
    expenses: "/gestion/comptabilite",
    maintenance: "/gestion/interventions",
    documents: "/gestion/documents",
    inventory: "/gestion/etats-lieux",
    team: "/gestion/equipe",
    reports: "/gestion/comptabilite",
  };
  return urlMap[prefix] || "/gestion";
}

/**
 * Élément de permission individuel avec countdown en temps réel
 */
function PermissionItem({ permission }: { permission: TemporaryPermission }) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  // Calculer le temps restant
  const calculateTimeRemaining = useCallback(() => {
    const expiresAt = new Date(permission.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeRemaining("Expiré");
      setIsExpiringSoon(true);
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    // Format hh:mm:ss ou mm:ss si moins d'une heure
    if (hours > 0) {
      setTimeRemaining(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    } else {
      setTimeRemaining(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }

    // Expire bientôt si moins de 30 minutes
    setIsExpiringSoon(diffMs < 30 * 60 * 1000);
  }, [permission.expires_at]);

  // Mettre à jour le countdown chaque seconde
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  const targetUrl = getPermissionUrl(permission.permission);

  return (
    <Link
      href={targetUrl}
      className={cn(
        "block p-2 rounded-lg border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md",
        isExpiringSoon
          ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
          : "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 hover:border-amber-300 dark:hover:border-amber-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
            {getPermissionLabel(permission.permission)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock
              size={12}
              className={isExpiringSoon ? "text-red-500 dark:text-red-400 animate-pulse" : "text-amber-600 dark:text-amber-400"}
            />
            <span
              className={cn(
                "text-xs font-mono tabular-nums",
                isExpiringSoon ? "text-red-600 dark:text-red-400 font-semibold" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {timeRemaining}
            </span>
          </div>
        </div>
        <ArrowRight size={14} className="text-amber-500 shrink-0 mt-0.5" />
      </div>
      {permission.reason && (
        <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
          {permission.reason}
        </p>
      )}
    </Link>
  );
}

/**
 * Convertit une clé de permission en label lisible
 */
function getPermissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    "leases.view": "Voir baux",
    "leases.create": "Créer baux",
    "leases.edit": "Éditer baux",
    "leases.delete": "Supprimer baux",
    "leases.terminate": "Résilier baux",
    "tenants.view": "Voir locataires",
    "tenants.edit": "Éditer locataires",
    "tenants.contact": "Contacter locataires",
    "payments.view": "Voir paiements",
    "payments.confirm": "Confirmer paiements",
    "payments.void": "Annuler paiements",
    "payments.receipts": "Quittances",
    "expenses.view": "Voir dépenses",
    "expenses.create": "Créer dépenses",
    "expenses.approve": "Approuver dépenses",
    "expenses.delete": "Supprimer dépenses",
    "maintenance.view": "Voir maintenance",
    "maintenance.create": "Créer maintenance",
    "maintenance.approve_quote": "Approuver devis",
    "maintenance.complete": "Terminer maintenance",
    "documents.view": "Voir documents",
    "documents.generate": "Générer documents",
    "documents.delete": "Supprimer documents",
    "properties.view": "Voir biens",
    "properties.create": "Créer biens",
    "properties.edit": "Éditer biens",
    "properties.publish": "Publier biens",
    "properties.delete": "Supprimer biens",
    "reports.view": "Voir rapports",
    "reports.export": "Exporter rapports",
    "team.members.view": "Voir membres",
    "team.members.invite": "Inviter membres",
    "team.members.edit_role": "Modifier rôles",
    "team.members.remove": "Supprimer membres",
    "team.settings.view": "Voir paramètres",
    "team.settings.edit": "Éditer paramètres",
    "team.audit.view": "Voir audit",
  };

  return labels[permission] || permission;
}
