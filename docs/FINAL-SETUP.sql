-- ✅ SCRIPT FINAL : Créer les fonctions grant_role et revoke_role avec p_role
-- Exécutez ce script dans Supabase SQL Editor

BEGIN;

-- ============================================================================
-- 1. Fonction helper pour vérifier les permissions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_superadmin_or_admin(u uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u AND ur.role IN ('superadmin', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = u AND LOWER(email) = 'barrymohamadou98@gmail.com'
  );
$$;

-- ============================================================================
-- 2. Fonction grant_role (bypass RLS) - Utilise p_role pour éviter conflit
-- ============================================================================
CREATE OR REPLACE FUNCTION public.grant_role(target_user uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
BEGIN
  -- Vérifier que l'appelant est admin ou superadmin
  SELECT (auth.uid())::uuid INTO caller;

  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin or admin';
  END IF;

  INSERT INTO public.user_roles(user_id, role, granted_by)
  VALUES (target_user, p_role, caller)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- ============================================================================
-- 3. Fonction revoke_role (bypass RLS) - Utilise p_role pour éviter conflit
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_role(target_user uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
  ur_id uuid;
BEGIN
  SELECT (auth.uid())::uuid INTO caller;

  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin or admin';
  END IF;

  SELECT id INTO ur_id
  FROM public.user_roles
  WHERE user_id = target_user AND role = p_role
  LIMIT 1;

  IF ur_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE id = ur_id;
  END IF;
END;
$$;

-- ============================================================================
-- 4. Permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin_or_admin(uuid) TO authenticated;

COMMIT;

-- ============================================================================
-- 5. Vérification
-- ============================================================================
SELECT 
  '✅ Fonctions créées:' as status,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin')
ORDER BY p.proname;

