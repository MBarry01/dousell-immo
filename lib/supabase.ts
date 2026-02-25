import { createClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// If we are in the browser, use the singleton
// If on server (e.g. static generation), we can still use a plain client
export const supabase =
  typeof window !== "undefined"
    ? createBrowserClient()
    : createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

// Validate credentials at runtime
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables."
  );
}

