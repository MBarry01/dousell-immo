-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Simple policy: Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Simple policy: Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Simple policy: Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow public read access to all avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
