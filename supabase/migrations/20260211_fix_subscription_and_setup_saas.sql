-- Strict SaaS + Hybrid Marketplace Migration (Final)
-- 1. Data Cleaning
-- 2. SaaS Constraints & Columns
-- 3. Stripe Connect Columns (Marketplace)
-- 4. Transactions Table (Marketplace)
-- 5. Logic (Cron)

BEGIN;

-- =====================================================
-- 1. DROP CONSTRAINTS FIRST (To allow data updates)
-- =====================================================
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_subscription_tier_check;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_subscription_status_check;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS check_active_subscription_tier;

-- =====================================================
-- 2. DATA SANITIZATION
-- =====================================================
UPDATE public.teams SET subscription_status = 'trialing' WHERE subscription_status = 'trial';
UPDATE public.teams SET subscription_status = 'canceled' WHERE subscription_status = 'none' OR subscription_status IS NULL;
UPDATE public.teams SET subscription_status = 'canceled' WHERE subscription_status NOT IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete');
UPDATE public.teams SET subscription_tier = 'pro' WHERE subscription_tier IS NULL;
UPDATE public.teams SET subscription_tier = 'pro' WHERE subscription_tier NOT IN ('starter', 'pro', 'enterprise');

-- =====================================================
-- 3. SAAS COLUMN MODIFICATIONS
-- =====================================================
ALTER TABLE public.teams ALTER COLUMN subscription_status SET DEFAULT 'trialing';
ALTER TABLE public.teams ALTER COLUMN subscription_tier SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN subscription_status SET NOT NULL;

ALTER TABLE public.teams ADD CONSTRAINT teams_subscription_tier_check 
    CHECK (subscription_tier IN ('starter', 'pro', 'enterprise'));

ALTER TABLE public.teams ADD CONSTRAINT teams_subscription_status_check
   CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'));

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS intended_plan TEXT;
CREATE INDEX IF NOT EXISTS idx_teams_subscription_status ON public.teams(subscription_status);
CREATE INDEX IF NOT EXISTS idx_teams_trial_end ON public.teams(subscription_trial_ends_at);

-- SaaS Stripe Customer
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_stripe_customer ON public.teams(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- =====================================================
-- 4. MARKETPLACE / STRIPE CONNECT COLUMNS
-- =====================================================
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending';

-- =====================================================
-- 5. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  lease_id UUID REFERENCES public.leases(id),
  property_id UUID REFERENCES public.properties(id),
  stripe_payment_intent_id TEXT,
  amount_total INTEGER NOT NULL,
  amount_payout INTEGER NOT NULL,
  amount_fee INTEGER NOT NULL,
  currency TEXT DEFAULT 'xof',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_team_id ON public.transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_pi ON public.transactions(stripe_payment_intent_id);

-- =====================================================
-- 6. LOGIC: Post-Trial Expiration Function
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Downgrade: Status to 'past_due' (Read only), Keep Tier
    UPDATE public.teams
    SET subscription_status = 'past_due'
    WHERE subscription_status = 'trialing' AND subscription_trial_ends_at < NOW();
END;
$$;

COMMIT;
