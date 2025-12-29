-- Migration: Add email verification columns to profiles
-- This enables custom email verification via Nodemailer instead of Supabase

-- Add email verification columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email_verification_token 
ON public.profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.email_verification_token IS 'Token for custom email verification via Nodemailer';
COMMENT ON COLUMN public.profiles.email_verification_expires IS 'Expiration timestamp for the verification token';
