-- Fonction SQL pour compter tous les utilisateurs depuis auth.users
-- Cette fonction bypass RLS et peut être appelée par les admins

CREATE OR REPLACE FUNCTION public.get_total_users()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COUNT(*)::integer
  FROM auth.users
  WHERE deleted_at IS NULL;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_total_users() TO authenticated;

-- Test
-- SELECT public.get_total_users();

