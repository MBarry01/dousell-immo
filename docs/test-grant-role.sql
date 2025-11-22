-- 🧪 TEST : Vérifier que les fonctions grant_role et revoke_role fonctionnent
-- Exécutez ce script après avoir créé les fonctions

-- 1. Vérifier que les fonctions existent
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin')
ORDER BY p.proname;

-- 2. Vérifier les permissions
SELECT 
  p.proname as function_name,
  r.rolname as role_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_proc_acl a ON a.oid = p.oid
JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role')
ORDER BY p.proname, r.rolname;

-- 3. Tester la fonction is_superadmin_or_admin avec votre UUID
-- Remplacez 'VOTRE_UUID' par votre UUID réel
DO $$
DECLARE
  test_user_id uuid;
  is_admin_result boolean;
BEGIN
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE LOWER(email) = 'barrymohamadou98@gmail.com'
  LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    SELECT public.is_superadmin_or_admin(test_user_id) INTO is_admin_result;
    RAISE NOTICE 'Test is_superadmin_or_admin pour %: %', test_user_id, is_admin_result;
  ELSE
    RAISE NOTICE 'Utilisateur barrymohamadou98@gmail.com non trouvé';
  END IF;
END;
$$;

-- 4. Tester grant_role (remplacez TARGET_USER_UUID par un UUID de test)
-- ATTENTION: Ne testez que si vous êtes connecté en tant que barrymohamadou98@gmail.com
DO $$
DECLARE
  admin_user_id uuid;
  test_target_id uuid;
BEGIN
  -- Récupérer votre UUID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE LOWER(email) = 'barrymohamadou98@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Tester en s'accordant le rôle admin (si pas déjà fait)
    BEGIN
      PERFORM public.grant_role(admin_user_id, 'admin');
      RAISE NOTICE 'Test grant_role réussi: admin accordé à %', admin_user_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erreur grant_role: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Utilisateur barrymohamadou98@gmail.com non trouvé';
  END IF;
END;
$$;

-- 5. Vérifier les rôles actuels
SELECT 
  u.email,
  ur.role,
  ur.created_at,
  ur.granted_by
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.created_at DESC
LIMIT 10;




