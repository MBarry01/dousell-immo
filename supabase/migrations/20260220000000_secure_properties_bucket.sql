-- Migration pour sécuriser le bucket "properties"
-- Limite la taille des fichiers à 5MB
-- Restreint les types MIME autorisés (WebP, JPEG, PNG)

-- 1. Mettre à jour la configuration du bucket pour la taille max (5MB = 5 * 1024 * 1024)
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']
WHERE id = 'properties';

-- 2. Création ou remplacement de la politique d'insertion stricte
-- Note: Les politiques de Storage Supabase utilisent la fonction `storage.extension()` et le champ `metadata`

DROP POLICY IF EXISTS "Restrict upload size and types for properties" ON storage.objects;

CREATE POLICY "Restrict upload size and types for properties" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'properties' 
    AND (storage.extension(name) = 'webp' OR storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png')
    -- La validation de taille se fait déjà au niveau du bucket (file_size_limit), mais on peut ajouter une couche
    AND (COALESCE(metadata->>'size', '0')::int < 5242880)
);

-- Même sécurisation optionnelle pour le bucket 'inventory' utilisé par les états des lieux
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'application/pdf']
WHERE id = 'inventory';

DROP POLICY IF EXISTS "Restrict upload size and types for inventory" ON storage.objects;

CREATE POLICY "Restrict upload size and types for inventory" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'inventory' 
    AND (storage.extension(name) = 'webp' OR storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'pdf')
    AND (COALESCE(metadata->>'size', '0')::int < 5242880)
);
