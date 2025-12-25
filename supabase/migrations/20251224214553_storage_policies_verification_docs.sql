-- ================================================
-- STORAGE POLICIES (RLS) pour le bucket verification-docs
-- Digital Safe - Dousell Immo
-- ================================================

-- NOTE: Ce script applique les policies de sécurité sur le bucket Storage
-- Il doit être exécuté APRÈS avoir créé le bucket 'verification-docs' dans le Dashboard

-- ================================================
-- 1. POLICY INSERT (Upload)
-- ================================================
-- Permet aux utilisateurs d'uploader UNIQUEMENT dans leur propre dossier

-- Supprimer la policy si elle existe déjà (pour permettre la réexécution)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================
-- 2. POLICY SELECT (Lecture/Téléchargement)
-- ================================================
-- Permet aux utilisateurs de voir leurs propres fichiers
-- Permet aux admins/modérateurs de voir TOUS les fichiers

DROP POLICY IF EXISTS "Users can view own files or admins can view all" ON storage.objects;

CREATE POLICY "Users can view own files or admins can view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (
    -- L'utilisateur peut voir ses propres fichiers
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Les admins/modérateurs peuvent voir tous les fichiers
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  )
);

-- ================================================
-- 3. POLICY DELETE (Suppression)
-- ================================================
-- Permet aux utilisateurs de supprimer UNIQUEMENT leurs propres fichiers

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================
-- 4. POLICY UPDATE (Modification - INTERDIT)
-- ================================================
-- Aucune policy UPDATE = immutable (pas de modification possible)
-- Les documents sont en lecture seule une fois uploadés

-- ================================================
-- ✅ MIGRATION TERMINÉE
-- ================================================
-- Les 3 Storage Policies ont été créées avec succès:
-- 1. "Users can upload to own folder" (INSERT) - Upload dans son propre dossier uniquement
-- 2. "Users can view own files or admins can view all" (SELECT) - Lecture restreinte
-- 3. "Users can delete own files" (DELETE) - Suppression de ses propres fichiers uniquement
