-- ⚡ SCRIPT URGENT : Créer les fonctions grant_role et revoke_role
-- Copiez-collez TOUT ce script dans Supabase SQL Editor et exécutez-le

-- ============================================================================
-- ÉTAPE 1 : Supprimer les anciennes fonctions
-- ============================================================================
DROP FUNCTION IF EXISTS public.grant_role(uuid, text);
DROP FUNCTION IF EXISTS public.revoke_role(uuid, text);
DROP FUNCTION IF EXISTS public.grant_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.revoke_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_superadmin_or_admin(uuid);

-- ============================================================================
-- ÉTAPE 2 : Fonction helper pour vérifier les permissions
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
-- ÉTAPE 3 : Fonction grant_role (bypass RLS)
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
  -- Récupérer l'utilisateur appelant
  caller := auth.uid();

  -- Vérification de sécurité
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Si caller est NULL (service_role), utiliser target_user
  IF caller IS NULL THEN
    caller := target_user;
  END IF;

  -- Insérer le rôle (utiliser p_role au lieu de role pour éviter conflit avec colonne)
  INSERT INTO public.user_roles(user_id, role, granted_by)
  VALUES (target_user, p_role, COALESCE(caller, target_user))
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- ============================================================================
-- ÉTAPE 4 : Fonction revoke_role (bypass RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_role(target_user uuid, p_role text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
BEGIN
  -- Récupérer l'utilisateur appelant
  caller := auth.uid();

  -- Vérification de sécurité
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Supprimer le rôle (utiliser p_role au lieu de role pour éviter conflit avec colonne)
  DELETE FROM public.user_roles 
  WHERE user_id = target_user AND role = p_role;
END;
$$;

-- ============================================================================
-- ÉTAPE 5 : Permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin_or_admin(uuid) TO authenticated;

-- ============================================================================
-- ÉTAPE 6 : Accorder le rôle admin à barrymohamadou98@gmail.com
-- ============================================================================
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE LOWER(email) = 'barrymohamadou98@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Utiliser la fonction grant_role pour tester
    PERFORM public.grant_role(admin_user_id, 'admin');
    RAISE NOTICE '✅ Rôle admin accordé à barrymohamadou98@gmail.com (UUID: %)', admin_user_id;
  ELSE
    RAISE NOTICE '❌ Utilisateur barrymohamadou98@gmail.com non trouvé';
  END IF;
END;
$$;

-- ============================================================================
-- ÉTAPE 7 : Vérification
-- ============================================================================
SELECT 
  '✅ Fonctions créées:' as status,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin')
ORDER BY p.proname;

SELECT 
  '✅ Rôles de barrymohamadou98@gmail.com:' as status,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com';

