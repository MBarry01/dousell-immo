"use client";

/**
 * useTemporaryPermissionsStore - Store Zustand pour les permissions temporaires
 *
 * Gère l'état global des permissions temporaires avec:
 * - Abonnement Supabase Realtime pour les mises à jour instantanées
 * - Auto-refresh quand une permission expire
 * - Synchronisation entre TemporaryAccessWidget et LockedSidebarItem
 */

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface TemporaryPermission {
  id: string;
  permission: string;
  expires_at: string;
  granted_by: string;
  reason?: string;
}

interface TemporaryPermissionsState {
  permissions: TemporaryPermission[];
  isLoading: boolean;
  teamId: string | null;
  userId: string | null;
  channel: RealtimeChannel | null;
  lastRefresh: number;

  // Actions
  initialize: (teamId: string, userId: string) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  cleanup: () => void;
  removeExpiredPermission: (permissionId: string) => void;
  hasPermission: (permission: string) => boolean;
  getPermissionExpiry: (permission: string) => Date | null;
}

export const useTemporaryPermissionsStore = create<TemporaryPermissionsState>(
  (set, get) => ({
    permissions: [],
    isLoading: true,
    teamId: null,
    userId: null,
    channel: null,
    lastRefresh: 0,

    /**
     * Initialise le store et configure l'abonnement Realtime
     */
    initialize: async (teamId: string, userId: string) => {
      const state = get();

      // Skip si déjà initialisé avec les mêmes IDs
      if (state.teamId === teamId && state.userId === userId && state.channel) {
        return;
      }

      // Cleanup previous subscription
      state.cleanup();

      set({ teamId, userId, isLoading: true });

      // Fetch initial permissions
      await get().fetchPermissions();

      // Setup Realtime subscription
      const supabase = createClient();

      const channel = supabase
        .channel(`temp_permissions:${teamId}:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "temporary_permissions",
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            console.log(
              "[TemporaryPermissions] Realtime event:",
              payload.eventType
            );

            // Refetch on any change
            get().fetchPermissions();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Temporary permissions realtime subscription active");
          } else if (status === "CHANNEL_ERROR") {
            console.warn(
              "⚠️ Temporary permissions realtime error, using polling fallback"
            );
            // Fallback: polling every 10 seconds
            const pollingInterval = setInterval(() => {
              get().fetchPermissions();
            }, 10000);

            // Store interval ID for cleanup (using a closure)
            const currentCleanup = get().cleanup;
            set({
              cleanup: () => {
                clearInterval(pollingInterval);
                currentCleanup();
              },
            });
          }
        });

      set({ channel });
    },

    /**
     * Récupère les permissions temporaires depuis la base de données
     */
    fetchPermissions: async () => {
      const { teamId, userId } = get();

      if (!teamId || !userId) {
        set({ permissions: [], isLoading: false });
        return;
      }

      try {
        const supabase = createClient();

        const { data, error } = await supabase.rpc(
          "get_active_temporary_permissions",
          {
            p_team_id: teamId,
            p_user_id: userId,
          }
        );

        if (error) {
          console.error(
            "[TemporaryPermissions] Error fetching permissions:",
            error
          );
          set({ isLoading: false });
          return;
        }

        // Filter out already expired permissions (belt and suspenders)
        const now = Date.now();
        const activePermissions = (data || []).filter(
          (p: TemporaryPermission) => new Date(p.expires_at).getTime() > now
        );

        set({
          permissions: activePermissions,
          isLoading: false,
          lastRefresh: now,
        });

        console.log(
          `[TemporaryPermissions] Loaded ${activePermissions.length} active permission(s)`
        );
      } catch (error) {
        console.error("[TemporaryPermissions] Unexpected error:", error);
        set({ isLoading: false });
      }
    },

    /**
     * Nettoie l'abonnement Realtime
     */
    cleanup: () => {
      const { channel } = get();

      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
        console.log("[TemporaryPermissions] Realtime subscription cleaned up");
      }

      set({
        channel: null,
        teamId: null,
        userId: null,
        permissions: [],
        isLoading: true,
      });
    },

    /**
     * Retire une permission expirée de la liste locale
     * (appelé par le countdown quand il atteint 0)
     */
    removeExpiredPermission: (permissionId: string) => {
      set((state) => ({
        permissions: state.permissions.filter((p) => p.id !== permissionId),
      }));

      // Trigger a full refresh to sync with server
      get().fetchPermissions();
    },

    /**
     * Vérifie si une permission spécifique est active
     */
    hasPermission: (permission: string) => {
      const { permissions } = get();
      const now = Date.now();

      return permissions.some(
        (p) =>
          p.permission === permission &&
          new Date(p.expires_at).getTime() > now
      );
    },

    /**
     * Récupère la date d'expiration d'une permission
     */
    getPermissionExpiry: (permission: string) => {
      const { permissions } = get();
      const perm = permissions.find((p) => p.permission === permission);

      return perm ? new Date(perm.expires_at) : null;
    },
  })
);

/**
 * Hook pour écouter les changements de permission spécifique
 * Retourne true si la permission est active, avec un trigger de re-render
 * quand l'état change
 */
export function useHasTemporaryPermission(permission: string): boolean {
  const hasPermission = useTemporaryPermissionsStore((state) =>
    state.permissions.some(
      (p) =>
        p.permission === permission &&
        new Date(p.expires_at).getTime() > Date.now()
    )
  );

  return hasPermission;
}

/**
 * Hook pour obtenir toutes les permissions actives
 */
export function useActiveTemporaryPermissions(): TemporaryPermission[] {
  return useTemporaryPermissionsStore((state) => state.permissions);
}
