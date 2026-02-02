"use client";

/**
 * TemporaryPermissionsWidget - Widget des permissions temporaires actives
 *
 * Affiche les permissions temporaires de l'utilisateur dans la sidebar
 * avec un indicateur visuel du temps restant
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LockKey, Clock, Warning } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TemporaryPermission {
  id: string;
  permission: string;
  expires_at: string;
  granted_by: string;
  reason?: string;
}

interface TemporaryPermissionsWidgetProps {
  userId: string;
  teamId: string;
  className?: string;
  compact?: boolean;
}

/**
 * Widget qui affiche les permissions temporaires actives de l'utilisateur
 */
export function TemporaryPermissionsWidget({
  userId,
  teamId,
  className,
  compact = false,
}: TemporaryPermissionsWidgetProps) {
  const [permissions, setPermissions] = useState<TemporaryPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        // Appeler l'API pour récupérer les permissions actives
        const response = await fetch(
          `/api/access-control/my-permissions?teamId=${teamId}`
        );

        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions || []);
        }
      } catch (error) {
        console.error("[TemporaryPermissions] Error fetching:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();

    // Rafraîchir toutes les minutes
    const interval = setInterval(fetchPermissions, 60000);
    return () => clearInterval(interval);
  }, [userId, teamId]);

  if (isLoading) {
    return (
      <Card className={cn("bg-zinc-900 border-zinc-800", className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock size={16} className="animate-spin" />
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permissions.length === 0) {
    return null; // Ne rien afficher si pas de permissions
  }

  // Mode compact (pour sidebar)
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 px-2">
          <LockKey size={16} className="text-amber-400" />
          <span className="text-xs font-medium text-zinc-400">
            Accès temporaires
          </span>
          <Badge variant="secondary" className="ml-auto">
            {permissions.length}
          </Badge>
        </div>

        <div className="space-y-1">
          {permissions.slice(0, 3).map((perm) => (
            <PermissionItem key={perm.id} permission={perm} compact />
          ))}

          {permissions.length > 3 && (
            <a
              href="/gestion/access-control"
              className="block px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              Voir tout ({permissions.length})
            </a>
          )}
        </div>
      </div>
    );
  }

  // Mode normal (pour dashboard)
  return (
    <Card className={cn("bg-zinc-900 border-zinc-800", className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LockKey size={20} className="text-amber-400" />
          Accès temporaires actifs
          <Badge variant="secondary" className="ml-auto">
            {permissions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {permissions.map((perm) => (
          <PermissionItem key={perm.id} permission={perm} />
        ))}

        <a
          href="/gestion/access-control"
          className="block text-center text-sm text-blue-400 hover:text-blue-300 hover:underline pt-2"
        >
          Gérer les accès temporaires →
        </a>
      </CardContent>
    </Card>
  );
}

/**
 * Item individuel de permission
 */
function PermissionItem({
  permission,
  compact = false,
}: {
  permission: TemporaryPermission;
  compact?: boolean;
}) {
  const expiresAt = new Date(permission.expires_at);
  const now = new Date();
  const totalDuration = 24 * 60 * 60 * 1000; // Assume 24h par défaut
  const remaining = expiresAt.getTime() - now.getTime();
  const hoursRemaining = remaining / (1000 * 60 * 60);
  const percentage = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

  // Déterminer la couleur selon le temps restant
  const color =
    hoursRemaining < 1
      ? "text-red-400"
      : hoursRemaining < 4
        ? "text-amber-400"
        : "text-green-400";

  const bgColor =
    hoursRemaining < 1
      ? "bg-red-500"
      : hoursRemaining < 4
        ? "bg-amber-500"
        : "bg-green-500";

  if (compact) {
    return (
      <div className="px-2 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-mono text-zinc-300 truncate">
            {permission.permission}
          </span>
          <span className={cn("text-xs font-medium", color)}>
            {hoursRemaining < 1
              ? `${Math.round(hoursRemaining * 60)}min`
              : `${Math.round(hoursRemaining)}h`}
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-1 bg-zinc-700"
          indicatorClassName={bgColor}
        />
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-mono text-zinc-200">
            {permission.permission}
          </p>
          {permission.reason && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
              {permission.reason}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn("border-current", color)}
        >
          {hoursRemaining < 1 ? (
            <>
              <Warning size={12} className="mr-1" />
              {Math.round(hoursRemaining * 60)}min
            </>
          ) : (
            <>
              <Clock size={12} className="mr-1" />
              {Math.round(hoursRemaining)}h
            </>
          )}
        </Badge>
      </div>

      <div className="space-y-1">
        <Progress
          value={percentage}
          className="h-1.5 bg-zinc-700"
          indicatorClassName={bgColor}
        />
        <p className="text-xs text-zinc-500">
          Expire{" "}
          {formatDistanceToNow(expiresAt, {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook pour récupérer les permissions temporaires de l'utilisateur
 */
export async function getMyTemporaryPermissions(userId: string, teamId: string) {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("temporary_permissions")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  if (error) {
    console.error("[My Temporary Permissions] Error:", error);
    return [];
  }

  return data || [];
}
