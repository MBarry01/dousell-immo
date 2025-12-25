-- Migration: Add is_identity_verified to profiles table
-- Description: Add boolean column to track global identity verification status
-- Created: 2025-12-25

-- Add is_identity_verified column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_identity_verified
ON profiles(is_identity_verified);

-- Add comment
COMMENT ON COLUMN profiles.is_identity_verified IS 'True when user identity has been verified via CNI/Passport certification';
