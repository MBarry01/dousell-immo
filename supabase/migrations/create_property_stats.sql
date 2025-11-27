-- Création de la table property_stats pour tracker les vues et clics
CREATE TABLE IF NOT EXISTS property_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'whatsapp_click', 'phone_click')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_property_stats_property_id ON property_stats(property_id);
CREATE INDEX IF NOT EXISTS idx_property_stats_action_type ON property_stats(action_type);
CREATE INDEX IF NOT EXISTS idx_property_stats_created_at ON property_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_property_stats_user_id ON property_stats(user_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_property_stats_property_action ON property_stats(property_id, action_type);

-- RLS (Row Level Security) : Permettre l'insertion pour tous (anonymes et authentifiés)
ALTER TABLE property_stats ENABLE ROW LEVEL SECURITY;

-- Nettoyage des politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Allow insert for all" ON property_stats;
DROP POLICY IF EXISTS "Allow read for admins" ON property_stats;

-- Policy : Permettre l'insertion pour tous
CREATE POLICY "Allow insert for all" ON property_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy : Permettre la lecture pour les admins uniquement
CREATE POLICY "Allow read for admins" ON property_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderator', 'superadmin', 'agent')
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE property_stats IS 'Table pour tracker les statistiques d''interaction avec les propriétés (vues, clics WhatsApp, clics téléphone)';
COMMENT ON COLUMN property_stats.property_id IS 'ID de la propriété concernée';
COMMENT ON COLUMN property_stats.action_type IS 'Type d''action : view, whatsapp_click, phone_click';
COMMENT ON COLUMN property_stats.user_id IS 'ID de l''utilisateur (null si anonyme)';
COMMENT ON COLUMN property_stats.created_at IS 'Date et heure de l''action';
