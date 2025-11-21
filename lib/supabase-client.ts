"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Singleton pattern for client-side
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "❌ Supabase credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables."
      );
      // Create a client with placeholder values to allow the app to load
      // The actual API calls will fail, but the build won't break
      supabaseClient = createClient(
        "https://placeholder.supabase.co",
        "placeholder-key",
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "dousell-immo-auth",
          },
        }
      );
    } else {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "dousell-immo-auth",
        },
      });
    }
  }
  return supabaseClient;
}

export const supabase = getSupabaseClient();

