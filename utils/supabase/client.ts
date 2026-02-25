"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// 1. Module-level variable (fastest, persists within the current bundle)
let cachedBrowserClient: SupabaseClient | undefined;

// 2. GlobalThis fallback (for cross-bundle sharing or dev hot-reload)
const globalWithSupabase = globalThis as unknown as {
  browserClient: SupabaseClient | undefined;
};

/**
 * Returns a single Supabase client instance for the browser context.
 * Reusing one instance avoids concurrent auth/storage issues (GoTrueClient warning).
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
  }

  // Double-check cache (Local first, then Global)
  if (typeof window !== "undefined") {
    if (cachedBrowserClient) return cachedBrowserClient;
    if (globalWithSupabase.browserClient) {
      cachedBrowserClient = globalWithSupabase.browserClient;
      return cachedBrowserClient;
    }
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  if (typeof window !== "undefined") {
    cachedBrowserClient = client;
    globalWithSupabase.browserClient = client;
  }

  return client;
}
