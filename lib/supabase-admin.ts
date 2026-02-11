import { createClient } from "@supabase/supabase-js";

// ATTENTION: Utilise la SERVICE_ROLE_KEY, pas la ANON_KEY !
// Ce fichier ne doit JAMAIS être importé côté client (React components).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Prevent crash during build time if envs are missing, but warn loudly
    if (process.env.NODE_ENV !== 'production') {
        console.warn("Missing Supabase Admin credentials (URL or Service Role Key). Admin operations will fail.");
    }
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
