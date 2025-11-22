-- Fonction SQL pour récupérer les rôles d'un utilisateur (bypass RLS si nécessaire)
-- Exécutez ce script dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT ARRAY_AGG(role)::text[]
  FROM public.user_roles
  WHERE user_id = target_user_id;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;

-- Test
SELECT public.get_user_roles('VOTRE_USER_ID_ICI'::uuid);




