-- Migration: Création des tables pour les alertes et préférences de notifications
-- Date: 2025
-- Description: Crée les tables `search_alerts` et `notification_preferences` pour le système d'alertes

-- ============================================================================
-- TABLE: search_alerts
-- ============================================================================
-- Stocke les alertes de recherche créées par les utilisateurs

CREATE TABLE IF NOT EXISTS public.search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  filters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT search_alerts_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 50)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON public.search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_active ON public.search_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_search_alerts_created_at ON public.search_alerts(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_search_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_alerts_updated_at
  BEFORE UPDATE ON public.search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_alerts_updated_at();

-- ============================================================================
-- TABLE: notification_preferences
-- ============================================================================
-- Stocke les préférences de notifications de chaque utilisateur

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{
    "new_properties": true,
    "property_updates": true,
    "price_drops": true,
    "matching_alerts": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur les deux tables
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: search_alerts
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres alertes
CREATE POLICY "Users can view their own search alerts"
  ON public.search_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres alertes
CREATE POLICY "Users can create their own search alerts"
  ON public.search_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres alertes
CREATE POLICY "Users can update their own search alerts"
  ON public.search_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres alertes
CREATE POLICY "Users can delete their own search alerts"
  ON public.search_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: notification_preferences
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres préférences
CREATE POLICY "Users can create their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres préférences
CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.search_alerts IS 'Alertes de recherche créées par les utilisateurs';
COMMENT ON COLUMN public.search_alerts.filters IS 'JSONB contenant les critères de recherche (category, city, minPrice, maxPrice, etc.)';
COMMENT ON COLUMN public.search_alerts.is_active IS 'Indique si l''alerte est active ou non';

COMMENT ON TABLE public.notification_preferences IS 'Préférences de notifications de chaque utilisateur';
COMMENT ON COLUMN public.notification_preferences.preferences IS 'JSONB contenant les préférences (new_properties, property_updates, price_drops, matching_alerts)';

