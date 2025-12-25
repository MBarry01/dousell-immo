-- Migration: Add RLS policy to allow reading public profile information
-- Description: Allow anyone to read basic profile info (needed for property owner display)
-- Created: 2025-12-25

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create policy to allow reading public profile information
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

-- Add comment
COMMENT ON POLICY "Public profiles are viewable by everyone" ON profiles IS 
'Allows anyone to read basic profile information like name, avatar, and verification status';
