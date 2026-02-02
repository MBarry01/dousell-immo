"use client";

/**
 * MemberQuotaProgress - Jauge de progression des quotas membres
 *
 * Affiche le nombre de membres/invitations actifs vs la limite
 * pour les équipes en période d'essai (Trial)
 */

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Users, Warning, CheckCircle, Crown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MemberQuotaProgressProps {
  /** Nombre de membres actifs */
  activeMembersCount: number;
  /** Nombre d'invitations en attente */
  pendingInvitesCount: number;
  /** Limite maximale (3 pour Trial) */
  limit: number;
  /** Statut de l'abonnement */
  subscriptionStatus?: 'none' | 'trial' | 'active' | 'expired' | 'canceled';
  /** Afficher en mode compact */
  compact?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Jauge de progression pour les quotas de membres
 */
export function MemberQuotaProgress({
  activeMembersCount,
  pendingInvitesCount,
  limit,
  subscriptionStatus = 'trial',
  compact = false,
  className,
}: MemberQuotaProgressProps) {
  const totalCount = activeMembersCount + pendingInvitesCount;
  const percentage = Math.min((totalCount / limit) * 100, 100);
  const remaining = Math.max(limit - totalCount, 0);
  const isAtLimit = totalCount >= limit;
  const isNearLimit = totalCount >= limit - 1;

  // Déterminer la couleur selon le statut
  const { color, bgColor, icon: Icon } = useMemo(() => {
    if (subscriptionStatus === 'active') {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500',
        icon: Crown,
      };
    }

    if (isAtLimit) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500',
        icon: Warning,
      };
    }

    if (isNearLimit) {
      return {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500',
        icon: Warning,
      };
    }

    return {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500',
      icon: CheckCircle,
    };
  }, [subscriptionStatus, isAtLimit, isNearLimit]);

  // Mode compact (pour affichage dans un header ou sidebar)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Users size={16} className={color} />
        <span className={cn("text-sm font-medium", color)}>
          {totalCount}/{limit}
        </span>
        {isAtLimit && (
          <Warning size={16} className="text-red-400" />
        )}
      </div>
    );
  }

  // Mode complet
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={20} className={color} />
          <span className="text-sm font-medium text-zinc-200">
            Membres de l'équipe
          </span>
        </div>
        <span className={cn("text-sm font-bold", color)}>
          {totalCount} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress
          value={percentage}
          className="h-2 bg-zinc-800"
          indicatorClassName={bgColor}
        />
      </div>

      {/* Details */}
      <div className="flex items-start gap-2 text-xs">
        {subscriptionStatus === 'active' ? (
          <div className="flex items-center gap-1.5 text-green-400">
            <Crown size={14} />
            <span>Abonnement Pro actif - Aucune limite</span>
          </div>
        ) : (
          <>
            {isAtLimit ? (
              <div className="flex items-start gap-1.5 text-red-400">
                <Warning size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Limite atteinte</p>
                  <p className="text-zinc-500">
                    Les équipes en période d'essai sont limitées à {limit} membres.{" "}
                    <a
                      href="/gestion/subscription"
                      className="text-blue-400 hover:underline"
                    >
                      Passer à Pro
                    </a>{" "}
                    pour inviter plus de membres.
                  </p>
                </div>
              </div>
            ) : isNearLimit ? (
              <div className="flex items-start gap-1.5 text-amber-400">
                <Warning size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Presque à la limite</p>
                  <p className="text-zinc-500">
                    Il vous reste {remaining} place{remaining > 1 ? 's' : ''}.{" "}
                    {remaining === 1 && (
                      <>
                        <a
                          href="/gestion/subscription"
                          className="text-blue-400 hover:underline"
                        >
                          Passez à Pro
                        </a>{" "}
                        pour débloquer plus de places.
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-zinc-400">
                <span className="text-zinc-300 font-medium">{remaining}</span> place
                {remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
                {activeMembersCount > 0 && (
                  <span className="text-zinc-500">
                    {" "}
                    ({activeMembersCount} actif{activeMembersCount > 1 ? 's' : ''}
                    {pendingInvitesCount > 0 &&
                      `, ${pendingInvitesCount} en attente`}
                    )
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA pour upgrade si limite atteinte */}
      {isAtLimit && subscriptionStatus === 'trial' && (
        <div className="mt-2">
          <a
            href="/gestion/subscription"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Crown size={14} />
            Passer à Pro
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour récupérer les stats de quota
 */
export async function getTeamMemberQuota(teamId: string) {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  // Récupérer le statut d'abonnement
  const { data: team } = await supabase
    .from("teams")
    .select("subscription_status")
    .eq("id", teamId)
    .single();

  // Compter les membres actifs
  const { count: activeMembersCount } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "active");

  // Compter les invitations en attente
  const { count: pendingInvitesCount } = await supabase
    .from("team_invitations")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "pending");

  const limit = team?.subscription_status === 'active' ? Infinity : 3;

  return {
    activeMembersCount: activeMembersCount || 0,
    pendingInvitesCount: pendingInvitesCount || 0,
    totalCount: (activeMembersCount || 0) + (pendingInvitesCount || 0),
    limit: team?.subscription_status === 'active' ? Infinity : 3,
    remaining: Math.max(limit - ((activeMembersCount || 0) + (pendingInvitesCount || 0)), 0),
    isAtLimit: ((activeMembersCount || 0) + (pendingInvitesCount || 0)) >= limit,
    subscriptionStatus: team?.subscription_status || 'none',
  };
}
