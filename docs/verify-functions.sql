-- ✅ VÉRIFICATION : Vérifier que les fonctions sont bien créées et fonctionnent
-- Exécutez ce script après avoir créé les fonctions

-- 1. Vérifier que les fonctions existent
SELECT 
  'Fonctions créées:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'NORMAL' END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin')
ORDER BY p.proname;

-- 2. Vérifier les permissions
SELECT 
  'Permissions:' as info,
  p.proname as function_name,
  r.rolname as role_name,
  a.privilege_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl a ON a.oid = p.oid
LEFT JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role')
ORDER BY p.proname, r.rolname;

-- 3. Vérifier que is_superadmin_or_admin existe
SELECT 
  'Fonction helper:' as info,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'is_superadmin_or_admin';

-- 4. Vérifier les rôles de barrymohamadou98@gmail.com
SELECT 
  'Rôles actuels:' as info,
  u.email,
  ur.role,
  ur.created_at,
  ur.granted_by
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
ORDER BY ur.created_at DESC;

-- 5. Test de la fonction is_superadmin_or_admin (remplacez par votre UUID si nécessaire)
DO $$
DECLARE
  admin_user_id uuid;
  is_admin_result boolean;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE LOWER(email) = 'barrymohamadou98@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    SELECT public.is_superadmin_or_admin(admin_user_id) INTO is_admin_result;
    RAISE NOTICE '✅ Test is_superadmin_or_admin pour %: %', admin_user_id, is_admin_result;
  ELSE
    RAISE NOTICE '❌ Utilisateur barrymohamadou98@gmail.com non trouvé';
  END IF;
END;
$$;

