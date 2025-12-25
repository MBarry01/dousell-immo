-- ================================================
-- CORRECTION: Ajouter les colonnes manquantes à user_documents
-- Digital Safe - Dousell Immo
-- ================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE user_documents
  ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'application/octet-stream';

-- Supprimer les valeurs par défaut (uniquement pour les futures insertions)
ALTER TABLE user_documents
  ALTER COLUMN file_name DROP DEFAULT,
  ALTER COLUMN file_size DROP DEFAULT,
  ALTER COLUMN mime_type DROP DEFAULT;

-- Vérifier que toutes les colonnes existent maintenant
-- La table devrait avoir: id, user_id, file_name, file_path, file_type, file_size, mime_type, source, created_at, updated_at
