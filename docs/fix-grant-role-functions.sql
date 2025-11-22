-- 🔧 FIX URGENT : Créer les fonctions grant_role et revoke_role qui bypass RLS
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================================================
-- Supprimer les anciennes fonctions si elles existent
-- ============================================================================
DROP FUNCTION IF EXISTS public.grant_role(uuid, text);
DROP FUNCTION IF EXISTS public.revoke_role(uuid, text);
DROP FUNCTION IF EXISTS public.grant_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.revoke_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_superadmin_or_admin(uuid);

-- ============================================================================
-- Fonction helper pour vérifier les permissions
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
-- Fonction pour accorder un rôle (bypass RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.grant_role(target_user uuid, role text)
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

  -- Vérification de sécurité : doit être superadmin, admin, ou barrymohamadou98@gmail.com
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Si caller est NULL (service_role), permettre quand même
  IF caller IS NULL THEN
    -- Utiliser le target_user comme granted_by pour les appels service_role
    caller := target_user;
  END IF;

  -- Insérer le rôle si n'existe pas
  INSERT INTO public.user_roles(user_id, role, granted_by)
  VALUES (target_user, role, COALESCE(caller, target_user))
  ON CONFLICT (user_id, role) DO NOTHING;

  -- L'audit est géré par le trigger automatiquement
END;
$$;

-- ============================================================================
-- Fonction pour retirer un rôle (bypass RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_role(target_user uuid, role text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
  ur_id uuid;
BEGIN
  -- Récupérer l'utilisateur appelant
  caller := auth.uid();

  -- Vérification de sécurité
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Récupérer l'ID du rôle à supprimer
  SELECT id INTO ur_id 
  FROM public.user_roles 
  WHERE user_id = target_user AND role = role 
  LIMIT 1;

  -- Supprimer le rôle
  IF ur_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE id = ur_id;
    -- L'audit est géré par le trigger automatiquement
  END IF;
END;
$$;

-- ============================================================================
-- Permissions : permettre aux utilisateurs authentifiés d'exécuter
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin_or_admin(uuid) TO authenticated;

-- ============================================================================
-- Vérification : Tester que les fonctions existent
-- ============================================================================
SELECT 
  'Fonctions créées:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin')
ORDER BY p.proname;

-- ============================================================================
-- Test : Accorder le rôle admin à barrymohamadou98@gmail.com si pas déjà fait
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
    
    RAISE NOTICE 'Rôle admin accordé à barrymohamadou98@gmail.com (UUID: %)', admin_user_id;
  ELSE
    RAISE NOTICE 'Utilisateur barrymohamadou98@gmail.com non trouvé';
  END IF;
END;
$$;

-- ============================================================================
-- Vérification finale : Voir les rôles de barrymohamadou98@gmail.com
-- ============================================================================
SELECT 
  'Rôles de barrymohamadou98@gmail.com:' as info,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com';




