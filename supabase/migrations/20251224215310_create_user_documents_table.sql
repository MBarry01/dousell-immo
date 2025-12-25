-- ================================================
-- TABLE user_documents - Digital Safe
-- Dousell Immo - Coffre-fort numérique sécurisé
-- ================================================

-- Créer la table pour stocker les métadonnées des documents
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL CHECK (file_type IN ('titre_propriete', 'bail', 'cni', 'facture', 'attestation', 'autre')),
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'verification')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_source ON user_documents(source);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at DESC);

-- ================================================
-- RLS (Row Level Security) POLICIES
-- ================================================

-- Activer RLS sur la table
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si présentes
DROP POLICY IF EXISTS "Users can view own documents" ON user_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON user_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can delete own manual documents" ON user_documents;

-- Policy 1: Les utilisateurs peuvent voir uniquement leurs propres documents
CREATE POLICY "Users can view own documents"
  ON user_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Les admins/modérateurs peuvent voir tous les documents
CREATE POLICY "Admins can view all documents"
  ON user_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  );

-- Policy 3: Les utilisateurs peuvent insérer leurs propres documents
CREATE POLICY "Users can insert own documents"
  ON user_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Les utilisateurs peuvent supprimer uniquement leurs documents manuels
CREATE POLICY "Users can delete own manual documents"
  ON user_documents
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND source = 'manual'
  );

-- ================================================
-- TRIGGER pour updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ✅ MIGRATION TERMINÉE
-- ================================================
-- Table user_documents créée avec succès
-- - RLS policies activées (4 policies)
-- - Trigger updated_at configuré
-- - Index pour optimisation des performances
