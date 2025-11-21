import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase Admin (Service Role)
 * 
 * Utilisé uniquement dans les Server Actions pour accéder aux données admin
 * comme récupérer l'email d'un utilisateur depuis son ID.
 * 
 * ⚠️ Ne jamais exposer ce client côté client !
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase admin credentials are missing. Define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

