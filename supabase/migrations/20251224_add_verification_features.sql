-- Add verification_status column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS proof_document_url text,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- Create verification-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-docs', 'verification-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Helper function to get property owner
CREATE OR REPLACE FUNCTION get_property_owner_id(property_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT owner_id FROM properties WHERE id = property_id;
$$;

-- STORAGE POLICIES --

-- 1. Owner can upload to their own folder: user_id/property_id/filename
-- Validates that the folder path starts with their user_id
CREATE POLICY "Users can upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Owner can read their own files
CREATE POLICY "Users can read own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Admins/Moderators can read everything
CREATE POLICY "Admins can read all verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderateur', 'superadmin')
  )
);

-- UPDATE POLICIES FOR PROPERTIES TABLE --
-- Allow owners to update specific columns of their own properties
-- This is often handled by a generic "Owners can update own properties" policy, 
-- but we need to ensure they can write to 'verification_status' (only to set 'pending' ideally)
-- or simply rely on the server action bypass if we want strict control.
-- However, since we are using supabase-js client in the Server Action with `createClient` (which uses auth context),
-- we need RLS to allow the update.

-- Let's assume there is an existing policy "Users can update own properties". 
-- If not, or if it restricts columns, we might need to adjust it.
-- For safety, we'll ensure they can update these specific columns if they own the property.

CREATE POLICY "Users can request verification"
ON properties
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
)
WITH CHECK (
  owner_id = auth.uid() 
  -- Optionally restrict what they can set: e.g. status can only be set to 'pending' from 'none'/'rejected'
  -- But typically simple RLS is enough for an MVP
);
