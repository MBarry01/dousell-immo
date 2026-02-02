/**
 * Supabase Edge Function: Cleanup Access Control
 * 
 * Exécuté via CRON toutes les heures pour:
 * 1. Nettoyer les permissions temporaires expirées
 * 2. Envoyer les notifications d'expiration (1h avant)
 * 
 * Déploiement:
 * supabase functions deploy cleanup-access-control
 * 
 * Configuration CRON:
 * supabase functions schedule cleanup-access-control "0 * * * *"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  deletedPermissions: number;
  expiringSoon: number;
  notificationsSent: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification (clé secrète ou auth header)
    const authHeader = req.headers.get('Authorization');
    const secretKey = Deno.env.get('CRON_SECRET_KEY');

    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase avec service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://dousell.com';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result: CleanupResult = {
      deletedPermissions: 0,
      expiringSoon: 0,
      notificationsSent: 0,
      errors: [],
    };

    // 1. Nettoyer les permissions expirées
    try {
      const { data: deletedCount, error: cleanupError } = await supabase.rpc(
        'cleanup_expired_permissions'
      );

      if (cleanupError) {
        result.errors.push(`Cleanup error: ${cleanupError.message}`);
      } else {
        result.deletedPermissions = deletedCount || 0;
      }
    } catch (err) {
      result.errors.push(`Cleanup exception: ${err.message}`);
    }

    // 2. Trouver les permissions qui expirent dans 1h
    try {
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      const { data: expiringPermissions, error: fetchError } = await supabase
        .from('temporary_permissions')
        .select('id, team_id, user_id, permission, expires_at')
        .lte('expires_at', oneHourFromNow.toISOString())
        .gte('expires_at', new Date().toISOString());

      if (fetchError) {
        result.errors.push(`Fetch expiring error: ${fetchError.message}`);
      } else if (expiringPermissions) {
        result.expiringSoon = expiringPermissions.length;

        // 3. Envoyer les notifications d'expiration
        // Note: Cette partie nécessite d'appeler une autre fonction ou un endpoint API
        // car les Edge Functions ne peuvent pas importer de code TypeScript du projet

        // Pour chaque permission expirant bientôt
        for (const perm of expiringPermissions) {
          try {
            // Appeler l'API route Next.js pour envoyer la notification
            const notifResponse = await fetch(`${appUrl}/api/cron/send-expiring-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secretKey}`,
              },
              body: JSON.stringify({
                teamId: perm.team_id,
                userId: perm.user_id,
                permission: perm.permission,
                expiresAt: perm.expires_at,
              }),
            });

            if (notifResponse.ok) {
              result.notificationsSent++;
            } else {
              result.errors.push(
                `Notification failed for permission ${perm.id}: ${notifResponse.statusText}`
              );
            }
          } catch (notifErr) {
            result.errors.push(
              `Notification exception for permission ${perm.id}: ${notifErr.message}`
            );
          }
        }
      }
    } catch (err) {
      result.errors.push(`Expiring fetch exception: ${err.message}`);
    }

    // 4. Retourner le résumé
    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        result,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.errors.length === 0 ? 200 : 207, // 207 Multi-Status si erreurs partielles
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
