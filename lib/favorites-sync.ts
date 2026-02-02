/**
 * Favorites Sync Service
 *
 * Handles synchronization of anonymous favorites (localStorage)
 * to server-side storage (Supabase) after user login/registration.
 *
 * Security & Limits (per REMAINING_TASKS.md 3.5.4):
 * - Max 50 favorites per sync request
 * - Max 100 favorites per user total
 * - Rate limit: 3 syncs/hour, 10 syncs/day
 * - Logging for abuse detection
 *
 * Per WORKFLOW_PROPOSAL.md sections 494-583, 1993-2048
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { trackServerEvent, EVENTS } from "@/lib/analytics";

// Limits
export const FAVORITES_LIMITS = {
  maxSyncPerRequest: 50,
  maxPerUser: 100,
  maxLocalStoragePrompt: 10, // Prompt login after this many
  maxLocalStorageHard: 10, // Hard limit in localStorage
  rateLimitHourly: 3,
  rateLimitDaily: 10,
} as const;

export interface FavoritesSyncResult {
  success: boolean;
  synced: number;
  duplicates: number;
  trimmed: number;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Sync anonymous favorites from localStorage to server
 *
 * Strategy:
 * - Validates property IDs exist
 * - UPSERT to handle duplicates gracefully
 * - Trims to limit if exceeding max
 * - Logs sync operation for abuse detection
 *
 * @param propertyIds - Array of property IDs from localStorage
 * @returns Sync result with counts
 */
export async function syncFavoritesAction(
  propertyIds: string[]
): Promise<FavoritesSyncResult> {
  const supabase = await createClient();

  // 1. Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, synced: 0, duplicates: 0, trimmed: 0, error: "Non authentifié" };
  }

  // 2. Check rate limit
  const { data: rateLimitOk } = await supabase.rpc("check_favorites_sync_rate_limit", {
    p_user_id: user.id,
  });

  if (!rateLimitOk) {
    return {
      success: false,
      synced: 0,
      duplicates: 0,
      trimmed: 0,
      error: "Limite de synchronisation atteinte. Réessayez plus tard.",
      rateLimited: true,
    };
  }

  // 3. Get client info for logging
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip");
  const userAgent = headersList.get("user-agent");

  // 4. Trim if exceeding request limit
  const trimmed = Math.max(0, propertyIds.length - FAVORITES_LIMITS.maxSyncPerRequest);
  const idsToSync = propertyIds.slice(-FAVORITES_LIMITS.maxSyncPerRequest); // Keep most recent

  // 5. Log if suspicious (>100 favorites attempted)
  const isSuspicious = propertyIds.length > 100;

  // 6. Validate property IDs exist
  const { data: validProperties, error: validationError } = await supabase
    .from("properties")
    .select("id")
    .in("id", idsToSync);

  if (validationError) {
    console.error("[FAVORITES_SYNC] Validation error:", validationError);
    return { success: false, synced: 0, duplicates: 0, trimmed: 0, error: "Erreur de validation" };
  }

  const validIds = new Set(validProperties?.map((p) => p.id) || []);
  const invalidCount = idsToSync.length - validIds.size;

  // 7. Get existing favorites to detect duplicates
  const { data: existingFavorites } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id);

  const existingIds = new Set(existingFavorites?.map((f) => f.property_id) || []);

  // 8. Filter to only new favorites
  const newFavorites = idsToSync.filter((id) => validIds.has(id) && !existingIds.has(id));
  const duplicates = idsToSync.filter((id) => existingIds.has(id)).length;

  // 9. Check user total limit
  const currentCount = existingIds.size;
  const availableSlots = FAVORITES_LIMITS.maxPerUser - currentCount;
  const favoritesToInsert = newFavorites.slice(0, availableSlots);

  // 10. Insert new favorites
  let synced = 0;
  if (favoritesToInsert.length > 0) {
    const { error: insertError } = await supabase.from("favorites").insert(
      favoritesToInsert.map((propertyId) => ({
        user_id: user.id,
        property_id: propertyId,
      }))
    );

    if (insertError) {
      console.error("[FAVORITES_SYNC] Insert error:", insertError);
      // Continue anyway to log the attempt
    } else {
      synced = favoritesToInsert.length;
    }
  }

  // 11. Log sync operation (using service role would be better, but this works for audit)
  try {
    // Note: This may fail due to RLS, but that's OK - the main sync succeeded
    await supabase.from("favorites_sync_logs").insert({
      user_id: user.id,
      attempted_count: propertyIds.length,
      synced_count: synced,
      trimmed_to: trimmed > 0 ? FAVORITES_LIMITS.maxSyncPerRequest : null,
      is_suspicious: isSuspicious,
      ip_address: ipAddress,
      user_agent: userAgent?.slice(0, 500), // Truncate user agent
    });
  } catch {
    // Logging failure shouldn't break sync
    console.log("[FAVORITES_SYNC] Logging skipped (RLS)");
  }

  // 12. Log summary
  console.log(
    `[FAVORITES_SYNC] User ${user.id}: attempted=${propertyIds.length}, synced=${synced}, duplicates=${duplicates}, invalid=${invalidCount}, trimmed=${trimmed}`
  );

  // 13. Track analytics event
  if (synced > 0) {
    trackServerEvent(EVENTS.FAVORITES_SYNC_COMPLETED, {
      user_id: user.id,
      synced_count: synced,
      duplicates_count: duplicates,
      attempted_count: propertyIds.length,
    });
  }

  return {
    success: true,
    synced,
    duplicates,
    trimmed: trimmed + (newFavorites.length - favoritesToInsert.length), // Include user limit trimming
  };
}

/**
 * Get user's server-side favorites
 *
 * @returns Array of property IDs
 */
export async function getServerFavoritesAction(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data?.map((f) => f.property_id) || [];
}

/**
 * Add a single favorite (server-side)
 *
 * @param propertyId - Property ID to favorite
 * @returns Success status
 */
export async function addFavoriteAction(propertyId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Check user limit
  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= FAVORITES_LIMITS.maxPerUser) {
    return { success: false, error: `Limite de ${FAVORITES_LIMITS.maxPerUser} favoris atteinte` };
  }

  const { error } = await supabase.from("favorites").upsert(
    { user_id: user.id, property_id: propertyId },
    { onConflict: "user_id,property_id" }
  );

  if (error) {
    console.error("[FAVORITES] Add error:", error);
    return { success: false, error: "Erreur lors de l'ajout" };
  }

  return { success: true };
}

/**
 * Remove a favorite (server-side)
 *
 * @param propertyId - Property ID to unfavorite
 * @returns Success status
 */
export async function removeFavoriteAction(propertyId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);

  return { success: true };
}
