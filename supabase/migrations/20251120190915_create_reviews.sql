-- Migration: Création de la table reviews pour les avis sur les biens
-- Date: 2025-01-27

-- Créer la table reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut laisser qu'un seul avis par bien
  UNIQUE(property_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Fonction pour calculer la note moyenne d'un bien
CREATE OR REPLACE FUNCTION get_property_average_rating(property_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM public.reviews
    WHERE property_id = property_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter le nombre d'avis d'un bien
CREATE OR REPLACE FUNCTION get_property_reviews_count(property_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.reviews
    WHERE property_id = property_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) - Politiques de sécurité
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les avis approuvés
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Politique : Les utilisateurs authentifiés peuvent créer leurs propres avis
CREATE POLICY "Users can create their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent modifier leurs propres avis
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres avis
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.reviews IS 'Table des avis clients sur les biens immobiliers';
COMMENT ON COLUMN public.reviews.id IS 'Identifiant unique de l''avis';
COMMENT ON COLUMN public.reviews.property_id IS 'ID du bien évalué';
COMMENT ON COLUMN public.reviews.user_id IS 'ID de l''utilisateur ayant laissé l''avis';
COMMENT ON COLUMN public.reviews.rating IS 'Note de 1 à 5 étoiles';
COMMENT ON COLUMN public.reviews.comment IS 'Commentaire textuel de l''avis';
COMMENT ON COLUMN public.reviews.user_name IS 'Nom de l''utilisateur affiché';
COMMENT ON COLUMN public.reviews.user_photo IS 'Photo de profil de l''utilisateur (URL)';
COMMENT ON COLUMN public.reviews.created_at IS 'Date de création de l''avis';
COMMENT ON COLUMN public.reviews.updated_at IS 'Date de dernière modification de l''avis';

