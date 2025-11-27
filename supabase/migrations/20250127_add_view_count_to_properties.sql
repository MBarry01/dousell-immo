-- Optimisation du tracking des vues : compteur incrémental au lieu d'historique complet

-- 1. Ajouter la colonne view_count à la table properties
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 2. Créer une fonction RPC pour incrémenter le compteur de manière atomique
CREATE OR REPLACE FUNCTION public.increment_view_count(property_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = property_id_param
  RETURNING view_count INTO new_count;
  
  -- Si la propriété n'existe pas, retourner 0
  IF new_count IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN new_count;
END;
$$;

-- 3. Commentaires pour documentation
COMMENT ON COLUMN public.properties.view_count IS 
  'Compteur incrémental du nombre de vues de cette propriété. Mis à jour de manière atomique via increment_view_count().';

COMMENT ON FUNCTION public.increment_view_count(UUID) IS 
  'Incrémente atomiquement le compteur de vues d''une propriété. Retourne le nouveau total. Sécurisé avec SECURITY DEFINER pour permettre l''appel depuis les clients anonymes.';

-- 4. Index pour améliorer les performances des requêtes de somme (optionnel mais recommandé)
CREATE INDEX IF NOT EXISTS idx_properties_view_count ON public.properties(view_count) 
  WHERE view_count > 0;

