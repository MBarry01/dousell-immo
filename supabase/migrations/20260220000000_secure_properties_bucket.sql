-- Migration pour sécuriser le bucket "properties"
-- Limite la taille des fichiers à 5MB
-- Restreint les types MIME autorisés (WebP, JPEG, PNG)

-- 1. Configuration des buckets pour s'assurer que les restrictions de taille et type sont natifs
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']
WHERE id = 'properties';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'application/pdf', 'image/jpg']
WHERE id = 'inventory';

-- 2. Nettoyage des anciennes politiques problématiques
DROP POLICY IF EXISTS "Restrict upload size and types for properties" ON storage.objects;
DROP POLICY IF EXISTS "Restrict upload size and types for inventory" ON storage.objects;

-- 3. Nouvelles politiques de sécurité basiques
-- La sécurité complexe (taille, extension) est déjà gérée nativement par le bucket (étape 1)
-- L'application s'assure des droits d'accès via les actions serveur (vérification Auth + Propriétaire/Équipe)

-- Bucket: properties
CREATE POLICY "properties_select" ON storage.objects FOR SELECT USING (bucket_id = 'properties');
CREATE POLICY "properties_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'properties');
CREATE POLICY "properties_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'properties');
CREATE POLICY "properties_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'properties');

-- Bucket: inventory
CREATE POLICY "inventory_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'inventory');
CREATE POLICY "inventory_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory');
CREATE POLICY "inventory_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'inventory');
CREATE POLICY "inventory_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'inventory');
