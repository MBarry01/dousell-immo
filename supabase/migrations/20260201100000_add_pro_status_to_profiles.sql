-- Migration: Add pro_status fields to profiles
-- Purpose: Distinguish between prospects and professional users (trial/active/expired)
-- Related: WORKFLOW_PROPOSAL.md section 0.7

-- 1. Add pro_status column with valid values
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pro_status TEXT DEFAULT 'none'
  CHECK (pro_status IN ('none', 'trial', 'active', 'expired'));

-- 2. Add trial expiration date
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pro_trial_ends_at TIMESTAMPTZ;

-- 3. Add first_login flag for /bienvenue page
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 4. Migrate existing users with gestion_locative_enabled to pro_status = 'active'
-- This ensures backward compatibility
UPDATE profiles
SET pro_status = 'active'
WHERE gestion_locative_enabled = true
  AND pro_status = 'none';

-- 5. Create index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_profiles_pro_status ON profiles(pro_status);

-- 6. Add comment for documentation
COMMENT ON COLUMN profiles.pro_status IS 'User subscription status: none (prospect), trial (14 days free), active (paying), expired (lapsed)';
COMMENT ON COLUMN profiles.pro_trial_ends_at IS 'Timestamp when trial period ends, null if not on trial';
COMMENT ON COLUMN profiles.first_login IS 'True on first login, used to show /bienvenue page once';
