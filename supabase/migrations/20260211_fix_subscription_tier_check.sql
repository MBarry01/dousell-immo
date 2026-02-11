-- Fix subscription_tier check constraint to include 'starter'
-- Based on lib/subscription/plans-config.ts

BEGIN;

-- 1. Drop the old constraint
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_subscription_tier_check;

-- 2. Add the new constraint with correct values
ALTER TABLE public.teams ADD CONSTRAINT teams_subscription_tier_check 
    CHECK (subscription_tier IN ('starter', 'pro', 'enterprise', 'free', 'premium'));

-- 3. Update existing rows if necessary (optional, just to be safe if any legacy data exists)
-- This is just a comment, we don't change data blindly.

COMMIT;
