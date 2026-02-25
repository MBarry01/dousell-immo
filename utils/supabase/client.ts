"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton browser client to avoid "Multiple GoTrueClient instances" warning.
 * Using globalThis ensures persistence across module re-evaluations and hot reloads.
 */
const globalWithSupabase = globalThis as unknown as {
  browserClient: SupabaseClient | undefined;
};

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
  }

  // 1. Return existing instance if available
  if (typeof window !== "undefined" && globalWithSupabase.browserClient) {
    return globalWithSupabase.browserClient;
  }

  // 2. Create new instance
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // 3. Store in global for future use
  if (typeof window !== "undefined") {
    globalWithSupabase.browserClient = client;
  }

  return client;
}
