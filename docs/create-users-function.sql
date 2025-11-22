-- Script SQL pour créer la fonction get_users_with_roles
-- À exécuter dans Supabase SQL Editor si la fonction n'existe pas
-- Ce script peut être exécuté plusieurs fois sans erreur

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS public.get_users_with_roles();

-- Créer la fonction pour récupérer tous les utilisateurs avec leurs rôles
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin (via email ou rôle)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND LOWER(auth.users.email) = 'barrymohamadou98@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Retourner tous les utilisateurs depuis auth.users avec leurs rôles
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE((u.raw_user_meta_data->>'full_name')::TEXT, NULL) as full_name,
    COALESCE((u.raw_user_meta_data->>'phone')::TEXT, NULL) as phone,
    COALESCE(
      ARRAY_AGG(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as roles,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at
  ORDER BY u.created_at DESC;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO anon;

-- Commentaire
COMMENT ON FUNCTION public.get_users_with_roles() IS 'Récupère tous les utilisateurs avec leurs rôles (admin uniquement)';

