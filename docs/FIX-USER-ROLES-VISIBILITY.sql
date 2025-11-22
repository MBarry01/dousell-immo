-- 🔧 FIX COMPLET : Permettre aux utilisateurs de voir leurs propres rôles
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================================================
-- 1. Créer la fonction get_user_roles (bypass RLS)
-- ============================================================================
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

-- ============================================================================
-- 2. Créer/Mettre à jour la politique RLS pour permettre aux utilisateurs 
--    de voir leurs propres rôles
-- ============================================================================
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. Vérification
-- ============================================================================
-- Vérifier que la politique existe
SELECT 
  'Politique créée:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname = 'user_roles_select_own';

-- Vérifier que la fonction existe
SELECT 
  'Fonction créée:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'get_user_roles';

-- ============================================================================
-- 4. Test (remplacez par un UUID réel pour tester)
-- ============================================================================
-- SELECT public.get_user_roles('VOTRE_USER_ID_ICI'::uuid);

