-- ================================================
-- RECONSTRUCTION COMPLÈTE: user_documents
-- Digital Safe - Dousell Immo
-- ================================================

-- Sauvegarder les données existantes si la table existe
DO $$
BEGIN
  -- Créer une table temporaire pour sauvegarder les données
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents') THEN
    CREATE TEMP TABLE user_documents_backup AS SELECT * FROM user_documents;
  END IF;
END $$;

-- Supprimer la table existante
DROP TABLE IF EXISTS user_documents CASCADE;

-- Recréer la table avec TOUTES les colonnes nécessaires
CREATE TABLE user_documents (
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
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_source ON user_documents(source);
CREATE INDEX idx_user_documents_created_at ON user_documents(created_at DESC);

-- ================================================
-- RLS (Row Level Security) POLICIES
-- ================================================

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

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
-- ✅ TABLE RECRÉÉE AVEC SUCCÈS
-- ================================================
-- Toutes les colonnes sont maintenant présentes:
-- id, user_id, file_name, file_path, file_type, file_size, mime_type, source, created_at, updated_at
