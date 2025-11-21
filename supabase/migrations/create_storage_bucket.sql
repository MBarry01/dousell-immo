-- Migration: Créer le bucket Storage 'properties' pour les images
-- Exécutez ce script dans Supabase Dashboard → SQL Editor

-- Créer le bucket 'properties' (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les politiques existantes si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Politique pour la lecture publique (tout le monde peut voir les images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- Politique pour l'upload (utilisateurs authentifiés uniquement)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

-- Politique pour la mise à jour (propriétaire uniquement)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour la suppression (propriétaire uniquement)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

