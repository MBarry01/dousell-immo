import { createClient } from "@supabase/supabase-js";

export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing Supabase Admin credentials (URL or Service Role Key).");
        // Return a dummy client or throw to prevent runtime crashes if env is missing in dev
        // But for cron it should fail if keys are missing.
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
