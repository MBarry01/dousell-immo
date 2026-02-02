// Edge Function: Cleanup des permissions temporaires expirées
// Exécuté automatiquement via CRON (toutes les heures)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[Cleanup] Starting cleanup job...");

    // Appeler la fonction RPC de cleanup
    const { data, error } = await supabase.rpc("cleanup_expired_permissions");

    if (error) {
      console.error("[Cleanup] Error:", error);
      throw error;
    }

    const deletedCount = data as number;
    console.log(`[Cleanup] Successfully deleted ${deletedCount} expired permissions`);

    // Optionnel: Notifier les utilisateurs dont les permissions ont expiré
    // (Peut être fait via un trigger PostgreSQL ou ici)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} expired permission(s)`,
        deletedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[Cleanup] Fatal error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
