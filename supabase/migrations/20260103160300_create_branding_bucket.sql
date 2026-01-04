-- Create branding storage bucket for logo and signature uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding',
    'branding',
    true,
    2097152, -- 2MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for branding bucket
CREATE POLICY "Users can upload their own branding files"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'branding' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own branding files"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'branding' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own branding files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'branding' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view branding files (public)"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');
