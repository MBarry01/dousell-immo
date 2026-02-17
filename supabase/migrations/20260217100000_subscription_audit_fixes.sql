-- =====================================================
-- Subscription Audit Fixes
-- 1. Add trial_reactivation_count to teams
-- 2. Update handle_expired_trials to downgrade tier
-- 3. Schedule pg_cron job for trial expiration
-- =====================================================

BEGIN;

-- 1. Compteur de reactivations d'essai
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS trial_reactivation_count INTEGER NOT NULL DEFAULT 0;

-- 2. Mise a jour de handle_expired_trials pour downgrader le tier
CREATE OR REPLACE FUNCTION public.handle_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.teams
    SET subscription_status = 'past_due',
        subscription_tier = 'starter'
    WHERE subscription_status = 'trialing'
      AND subscription_trial_ends_at < NOW();
END;
$$;

-- 3. Creer le job pg_cron (tous les jours a 3h du matin)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Supprimer le job existant si present
    PERFORM cron.unschedule('expire-trials');
    -- Creer le nouveau job
    PERFORM cron.schedule('expire-trials', '0 3 * * *', 'SELECT public.handle_expired_trials()');
  ELSE
    RAISE NOTICE 'pg_cron not available - trial expiration must be handled by application code';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;

COMMIT;
