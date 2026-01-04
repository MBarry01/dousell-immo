-- Create a private bucket for inventory photos
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('inventory', 'inventory', false, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the inventory bucket
CREATE POLICY "Inv authenticated users can upload inventory photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inventory' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Inv owners can view their inventory photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inventory' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Inv owners can update their inventory photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inventory' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Inv owners can delete their inventory photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inventory' AND (storage.foldername(name))[1] = auth.uid()::text);
