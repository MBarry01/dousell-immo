"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UnreadCounts {
  unreadMessages: number;
  pendingMaintenance: number;
}

/**
 * Hook for owner/gestion unread counts with Supabase Realtime.
 * Listens for changes on messages and maintenance_requests tables.
 */
export function useOwnerUnreadCounts(userId: string | null, teamId: string | null) {
  const [counts, setCounts] = useState<UnreadCounts>({ unreadMessages: 0, pendingMaintenance: 0 });
  const channelsRef = useRef<RealtimeChannel[]>([]);

  const fetchCounts = useCallback(async () => {
    if (!userId || !teamId) return;

    try {
      const { getOwnerUnreadCounts } = await import("@/lib/unread-counts");
      const result = await getOwnerUnreadCounts();
      setCounts(result);
    } catch (error) {
      console.error("Error fetching owner unread counts:", error);
    }
  }, [userId, teamId]);

  useEffect(() => {
    if (!userId || !teamId) return;

    fetchCounts();

    const supabase = createClient();

    // Listen for message changes
    const messagesChannel = supabase
      .channel(`owner-messages-badge:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => { fetchCounts(); }
      )
      .subscribe();

    // Listen for maintenance changes
    const maintenanceChannel = supabase
      .channel(`owner-maintenance-badge:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_requests" },
        () => { fetchCounts(); }
      )
      .subscribe();

    channelsRef.current = [messagesChannel, maintenanceChannel];

    // Fallback polling every 60s
    const pollingInterval = setInterval(fetchCounts, 60000);

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
      clearInterval(pollingInterval);
    };
  }, [userId, teamId, fetchCounts]);

  return { ...counts, refetch: fetchCounts };
}

/**
 * Hook for tenant unread counts with polling.
 * Tenants don't have Supabase auth, so we use API polling.
 */
export function useTenantUnreadCounts() {
  const [counts, setCounts] = useState<UnreadCounts>({ unreadMessages: 0, pendingMaintenance: 0 });

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/tenant/unread-counts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCounts({
          unreadMessages: data.unreadMessages || 0,
          pendingMaintenance: data.pendingMaintenance || 0,
        });
      }
    } catch {
      // Silently ignore - counts will stay at 0
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // Poll every 30s for tenants (no realtime since no auth)
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { ...counts, refetch: fetchCounts };
}
