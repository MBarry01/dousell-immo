-- Stripe Connect Production Hardening
-- 1. Fix Downgrade Logic (Critical)
-- 2. Add Logging Table
-- 3. Add Granular Connect Status Columns

BEGIN;

-- =====================================================
-- 1. LOGGING (For Production Debugging)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stripe_events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    stripe_event_id TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_stripe_event UNIQUE (stripe_event_id)
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_log_type ON public.stripe_events_log(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_log_created ON public.stripe_events_log(created_at);

-- =====================================================
-- 2. TEAMS TABLE UPDATES (Connect Status)
-- =====================================================
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS connect_onboarding_completed_at TIMESTAMPTZ;

-- Re-ensure Connect columns exist (from previous steps)
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_teams_stripe_account_id ON public.teams(stripe_account_id);

-- =====================================================
-- 3. FIX CRON FUNCTION (Critical: No Tier Change)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Downgrade expired trials to 'past_due' ONLY (Read-only mode)
    -- We DO NOT change the tier.
    UPDATE public.teams
    SET subscription_status = 'past_due'
    WHERE subscription_status = 'trialing' AND subscription_trial_ends_at < NOW();
END;
$$;

COMMIT;
