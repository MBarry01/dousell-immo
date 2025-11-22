-- Migration SIMPLIFIÉE: Créer le bucket Storage 'properties' et politiques RLS
-- Exécutez ce script dans Supabase Dashboard → SQL Editor

-- 1. Créer le bucket 'properties' (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer les politiques existantes (pour éviter les doublons)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 3. Politique pour la lecture publique (OBLIGATOIRE pour que le test fonctionne)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- 4. Politique pour l'upload (utilisateurs authentifiés uniquement)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);


