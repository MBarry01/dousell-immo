-- Description: Fix missing profiles, add email column, and ensure automatic creation via trigger
-- Date: 2026-01-01
-- Author: Doussel Immo System

-- 1. Fix: Ensure 'email' column exists in profiles (It was missing in local schema)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- Add index for performance on email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Create the function to handle new user entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, -- Keep email linked to auth
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 4. Dynamic Backfill: Repair existing users who have no profile
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Force update email for existing profiles that might have null email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
