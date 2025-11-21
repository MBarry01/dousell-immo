-- Migration: Création de la table notifications
-- Date: 2025-01-28

-- Créer le type enum pour les types de notifications
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  resource_path TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- RLS (Row Level Security) - Politiques de sécurité
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = user_uuid AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE public.notifications IS 'Table des notifications utilisateur';
COMMENT ON COLUMN public.notifications.id IS 'Identifiant unique de la notification';
COMMENT ON COLUMN public.notifications.user_id IS 'ID de l''utilisateur destinataire';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification (info, success, warning, error)';
COMMENT ON COLUMN public.notifications.title IS 'Titre de la notification';
COMMENT ON COLUMN public.notifications.message IS 'Message de la notification';
COMMENT ON COLUMN public.notifications.resource_path IS 'Chemin de redirection (ex: /compte/mes-biens ou /biens/123)';
COMMENT ON COLUMN public.notifications.is_read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN public.notifications.created_at IS 'Date de création de la notification';

