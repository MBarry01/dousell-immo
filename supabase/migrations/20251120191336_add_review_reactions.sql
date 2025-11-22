-- Migration: Ajout du système de likes/dislikes sur les avis
-- Date: 2025-11-20

-- Créer la table review_reactions pour les likes/dislikes
CREATE TABLE IF NOT EXISTS public.review_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut réagir qu'une fois par avis
  UNIQUE(review_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id ON public.review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id ON public.review_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_type ON public.review_reactions(reaction_type);

-- Fonction pour compter les likes d'un avis
CREATE OR REPLACE FUNCTION get_review_likes_count(review_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.review_reactions
    WHERE review_id = review_uuid AND reaction_type = 'like'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les dislikes d'un avis
CREATE OR REPLACE FUNCTION get_review_dislikes_count(review_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.review_reactions
    WHERE review_id = review_uuid AND reaction_type = 'dislike'
  );
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) - Politiques de sécurité
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les réactions
CREATE POLICY "Review reactions are viewable by everyone"
  ON public.review_reactions
  FOR SELECT
  USING (true);

-- Politique : Les utilisateurs authentifiés peuvent créer leurs propres réactions
CREATE POLICY "Users can create their own reactions"
  ON public.review_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent modifier leurs propres réactions
CREATE POLICY "Users can update their own reactions"
  ON public.review_reactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres réactions
CREATE POLICY "Users can delete their own reactions"
  ON public.review_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.review_reactions IS 'Table des réactions (likes/dislikes) sur les avis';
COMMENT ON COLUMN public.review_reactions.id IS 'Identifiant unique de la réaction';
COMMENT ON COLUMN public.review_reactions.review_id IS 'ID de l''avis concerné';
COMMENT ON COLUMN public.review_reactions.user_id IS 'ID de l''utilisateur ayant réagi';
COMMENT ON COLUMN public.review_reactions.reaction_type IS 'Type de réaction: like ou dislike';
COMMENT ON COLUMN public.review_reactions.created_at IS 'Date de création de la réaction';


