"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Singleton browser client to avoid "Multiple GoTrueClient instances" warning. */
let browserClient: SupabaseClient | null = null;

/**
 * Returns a single Supabase client instance for the browser context.
 * Reusing one instance avoids concurrent auth/storage issues (GoTrueClient warning).
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "❌ Supabase credentials are missing. Please check your .env.local file."
    );
    throw new Error(
      "Supabase credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
  }

  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

