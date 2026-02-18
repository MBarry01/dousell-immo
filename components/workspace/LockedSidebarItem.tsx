"use client";

/**
 * LockedSidebarItem - Élément de navigation verrouillable
 *
 * Affiche un élément de menu qui peut être :
 * - Normal (lien cliquable) si l'utilisateur a la permission
 * - Verrouillé (grisé avec cadenas) si non autorisé, avec clic qui ouvre la modale
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { TEAM_PERMISSIONS, type TeamPermissionKey } from "@/lib/team-permissions";
import type { LucideIcon } from "lucide-react";

interface LockedSidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  requiredPermission?: TeamPermissionKey;
  requiredTier?: 'pro' | 'enterprise'; // Tier requis
  currentTeamId?: string; // ID de l'équipe actuellement sélectionnée
  currentTeamTier?: string; // Tier de l'équipe
  currentTeamStatus?: string; // Statut de l'abonnement
  onNavigate?: () => void;
  onRequestAccess?: (permission: TeamPermissionKey, label: string) => void;
  badgeCount?: number;
}

/**
 * Vérifie si un rôle a une permission donnée dans la matrice
 */
function roleHasPermission(role: string, permission: TeamPermissionKey): boolean {
  const allowedRoles = TEAM_PERMISSIONS[permission];
  if (!allowedRoles) return false;

  // Normaliser le rôle en minuscules pour la comparaison
  const normalizedRole = role.toLowerCase();
  return allowedRoles.some(r => r.toLowerCase() === normalizedRole);
}

const TIER_LEVELS: Record<string, number> = {
  'starter': 0,
  'pro': 1,
  'enterprise': 2
};

export function LockedSidebarItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  isMobile,
  requiredPermission,
  requiredTier,
  currentTeamId,
  currentTeamTier,
  currentTeamStatus,
  onNavigate,
  onRequestAccess,
  badgeCount = 0,
}: LockedSidebarItemProps) {
  const [hasAccess, setHasAccess] = useState(true); // Par défaut autorisé
  const [isLoading, setIsLoading] = useState(!!requiredPermission || !!requiredTier);
  const [lockReason, setLockReason] = useState<'tier' | 'permission' | null>(null);

  useEffect(() => {
    // 0. Vérification du statut d'abonnement (bloqué = lecture seule)
    const BLOCKED_STATUSES = ['past_due', 'canceled', 'unpaid', 'incomplete'];
    if (currentTeamStatus && BLOCKED_STATUSES.includes(currentTeamStatus) && requiredTier) {
      setHasAccess(false);
      setLockReason('tier');
      setIsLoading(false);
      return;
    }

    // 1. Vérification du Tier
    // Si en essai ('trial' ou 'trialing'), on considère comme Pro minimum
    const isTrialing = currentTeamStatus === 'trial' || currentTeamStatus === 'trialing';

    if (requiredTier && !isTrialing) {
      const currentLevel = TIER_LEVELS[currentTeamTier || 'starter'] || 0;
      const requiredLevel = TIER_LEVELS[requiredTier] || 1;

      if (currentLevel < requiredLevel) {
        setHasAccess(false);
        setLockReason('tier');
        setIsLoading(false);
        return;
      }
    }

    // 2. Si pas de permission requise, accès autorisé (si tier OK)
    if (!requiredPermission) {
      setHasAccess(true);
      setLockReason(null);
      setIsLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        const supabase = createClient();

        // Récupérer l'utilisateur
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasAccess(false);
          setLockReason('permission');
          setIsLoading(false);
          return;
        }

        // Récupérer le rôle de l'utilisateur dans l'équipe SÉLECTIONNÉE
        let query = supabase
          .from("team_members")
          .select("team_id, role")
          .eq("user_id", user.id)
          .eq("status", "active");

        // Si on a un currentTeamId, filtrer par cette équipe
        if (currentTeamId) {
          query = query.eq("team_id", currentTeamId);
        }

        const { data: teamMember } = await query.maybeSingle();

        if (!teamMember) {
          setHasAccess(false);
          setLockReason('permission');
          setIsLoading(false);
          return;
        }

        const userRole = teamMember.role as string;

        // 1. Vérifier si le rôle a la permission dans la matrice
        const hasRolePermission = roleHasPermission(userRole, requiredPermission);

        if (hasRolePermission) {
          setHasAccess(true);
          setLockReason(null);
          setIsLoading(false);
          return;
        }

        // 2. Sinon, vérifier les permissions temporaires
        const { data: tempPermission } = await supabase.rpc(
          "has_temporary_permission",
          {
            p_team_id: teamMember.team_id,
            p_user_id: user.id,
            p_permission: requiredPermission,
          }
        );

        const hasTempAccess = !!tempPermission;
        setHasAccess(hasTempAccess);
        setLockReason(hasTempAccess ? null : 'permission');
      } catch (error) {
        console.error("[LockedSidebarItem] Permission check error:", error);
        setHasAccess(false);
        setLockReason('permission');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [requiredPermission, requiredTier, currentTeamId, currentTeamTier, currentTeamStatus]);

  // Pendant le chargement, afficher comme normal
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg transition-all duration-200 h-11",
          "px-[14px]",
          "text-slate-700 dark:text-muted-foreground animate-pulse"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {(!isCollapsed || isMobile) && (
          <span className="text-sm truncate ml-3">{label}</span>
        )}
      </div>
    );
  }

  // Si l'utilisateur a l'accès → lien normal
  if (hasAccess) {
    return (
      <Link
        href={href}
        prefetch={false} // Disable prefetch to prevent stale RSC cache
        onClick={onNavigate}
        className={cn(
          "flex items-center rounded-lg transition-all duration-200 group h-11",
          "px-[14px]",
          isActive
            ? "bg-[#0F172A] text-white shadow-md font-medium dark:bg-primary/10 dark:text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <span className="relative shrink-0">
          <Icon
            className={cn(
              "h-5 w-5 transition-all",
              isActive
                ? "text-white dark:text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          {badgeCount > 0 && isCollapsed && !isMobile && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </span>
        {(!isCollapsed || isMobile) && (
          <>
            <span className="text-sm truncate ml-3 flex-1">{label}</span>
            {badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ml-auto">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  // Si verrouillé → bouton avec cadenas
  return (
    <button
      onClick={() => {
        // Si c'est un problème de Tier, on redirige vers la config pour upgrade
        if (lockReason === 'tier') {
          window.location.href = '/gestion/config?tab=subscription';
          return;
        }
        // Sinon c'est une permission manquante
        if (lockReason === 'permission' && onRequestAccess && requiredPermission) {
          onRequestAccess(requiredPermission, label);
        }
      }}
      className={cn(
        "w-full flex items-center justify-between rounded-lg transition-all duration-200 group h-11 relative",
        "px-[14px]",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
      )}
      title={isCollapsed && !isMobile ? `${label} (Verrouillé)` : undefined}
    >
      <div className="flex items-center">
        <Icon className="h-5 w-5 shrink-0 opacity-50" />
        {(!isCollapsed || isMobile) && (
          <span className="text-sm truncate ml-3 opacity-50">{label}</span>
        )}
      </div>
      {/* Cadenas en mode étendu */}
      {(!isCollapsed || isMobile) && (
        <Lock
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            "text-slate-900 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-zinc-300"
          )}
        />
      )}
      {/* Petit cadenas en mode collapsed - positionné en bas à droite de l'icône */}
      {isCollapsed && !isMobile && (
        <Lock className="h-3 w-3 absolute bottom-1 right-2 text-slate-900 dark:text-zinc-500" />
      )}
    </button>
  );
}
