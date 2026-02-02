"use client";

/**
 * useFavoritesSync Hook
 *
 * Handles synchronization of localStorage favorites to server after login.
 *
 * Features:
 * - Auto-detects localStorage favorites on mount
 * - Triggers sync after login/registration
 * - Shows toast notifications for sync results
 * - Merges server favorites back to localStorage
 *
 * Per WORKFLOW_PROPOSAL.md sections 494-583
 */

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFavoritesStore } from "@/store/use-store";
import {
  syncFavoritesAction,
  getServerFavoritesAction,
  FAVORITES_LIMITS,
} from "@/lib/favorites-sync";

const SYNC_FLAG_KEY = "dousell-favorites-synced";

interface UseFavoritesSyncOptions {
  /** User ID if authenticated */
  userId?: string | null;
  /** Trigger sync immediately (e.g., after login) */
  triggerSync?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

interface UseFavoritesSyncReturn {
  /** Manually trigger sync */
  syncNow: () => Promise<void>;
  /** Check if should prompt login */
  shouldPromptLogin: boolean;
  /** Number of local favorites */
  localCount: number;
}

export function useFavoritesSync(options: UseFavoritesSyncOptions = {}): UseFavoritesSyncReturn {
  const { userId, triggerSync = false, showToasts = true } = options;
  const router = useRouter();
  const { favorites, addFavorite, removeFavorite } = useFavoritesStore();
  const syncInProgress = useRef(false);
  const hasSynced = useRef(false);

  const localCount = favorites.length;
  const shouldPromptLogin = !userId && localCount >= FAVORITES_LIMITS.maxLocalStoragePrompt;

  /**
   * Sync localStorage favorites to server
   */
  const syncNow = useCallback(async () => {
    if (!userId || syncInProgress.current) return;

    // Check if already synced this session
    const syncedFlag = sessionStorage.getItem(SYNC_FLAG_KEY);
    if (syncedFlag === userId && !triggerSync) {
      return;
    }

    syncInProgress.current = true;

    try {
      const localIds = favorites.map((p) => p.id);

      // Skip if no local favorites
      if (localIds.length === 0) {
        // Still fetch server favorites to merge
        const serverIds = await getServerFavoritesAction();
        if (serverIds.length > 0 && showToasts) {
          toast.info(`${serverIds.length} favoris restaurés depuis le serveur`);
        }
        sessionStorage.setItem(SYNC_FLAG_KEY, userId);
        return;
      }

      // Sync local to server
      const result = await syncFavoritesAction(localIds);

      if (result.rateLimited) {
        if (showToasts) {
          toast.error(result.error);
        }
        return;
      }

      if (result.success) {
        // Mark as synced
        sessionStorage.setItem(SYNC_FLAG_KEY, userId);

        // Show notification
        if (showToasts) {
          if (result.synced > 0) {
            toast.success(`${result.synced} favoris synchronisés`);
          }
          if (result.trimmed > 0) {
            toast.info(`${result.trimmed} favoris non synchronisés (limite atteinte)`);
          }
        }

        // Fetch server favorites to get complete list
        const serverIds = await getServerFavoritesAction();

        // We keep localStorage for offline access, but server is source of truth
        // Clear sync flag to prevent re-sync on refresh
        hasSynced.current = true;
      } else if (result.error && showToasts) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("[useFavoritesSync] Sync error:", error);
      if (showToasts) {
        toast.error("Erreur de synchronisation des favoris");
      }
    } finally {
      syncInProgress.current = false;
    }
  }, [userId, favorites, showToasts, triggerSync]);

  // Auto-sync on mount if authenticated and has local favorites
  useEffect(() => {
    if (userId && favorites.length > 0 && !hasSynced.current) {
      // Small delay to avoid sync during navigation
      const timer = setTimeout(() => {
        syncNow();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userId, syncNow, favorites.length]);

  // Trigger sync immediately if requested
  useEffect(() => {
    if (triggerSync && userId) {
      syncNow();
    }
  }, [triggerSync, userId, syncNow]);

  return {
    syncNow,
    shouldPromptLogin,
    localCount,
  };
}

/**
 * Hook for showing login prompt when favorites limit reached
 */
export function useFavoritesLoginPrompt() {
  const router = useRouter();
  const { favorites } = useFavoritesStore();

  const promptLogin = useCallback(() => {
    toast.info("Connectez-vous pour sauvegarder vos favoris", {
      action: {
        label: "Se connecter",
        onClick: () => router.push("/login?next=/favoris"),
      },
      duration: 5000,
    });
  }, [router]);

  const checkAndPrompt = useCallback(
    (currentCount: number) => {
      // Prompt after 3 favorites added
      if (currentCount === 3 || currentCount === 5 || currentCount === FAVORITES_LIMITS.maxLocalStoragePrompt) {
        promptLogin();
      }
    },
    [promptLogin]
  );

  return {
    promptLogin,
    checkAndPrompt,
    shouldPrompt: favorites.length >= FAVORITES_LIMITS.maxLocalStoragePrompt,
  };
}
