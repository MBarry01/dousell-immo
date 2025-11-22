-- Script de test pour vérifier les modérateurs et leurs notifications
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier les modérateurs et admins dans user_roles
SELECT 
  'Modérateurs et Admins:' as info,
  user_id,
  role,
  created_at
FROM public.user_roles
WHERE role IN ('admin', 'moderateur', 'superadmin')
ORDER BY role, created_at DESC;

-- 2. Vérifier les notifications récentes pour les modérateurs/admins
SELECT 
  'Notifications récentes:' as info,
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.is_read,
  n.created_at,
  ur.role as user_role
FROM public.notifications n
LEFT JOIN public.user_roles ur ON n.user_id = ur.user_id
WHERE ur.role IN ('admin', 'moderateur', 'superadmin')
   OR n.user_id IN (
     SELECT id FROM auth.users 
     WHERE email = 'barrymohamadou98@gmail.com'
   )
ORDER BY n.created_at DESC
LIMIT 20;

-- 3. Compter les notifications non lues par utilisateur (modérateurs/admins)
SELECT 
  'Notifications non lues:' as info,
  n.user_id,
  ur.role,
  COUNT(*) as unread_count
FROM public.notifications n
LEFT JOIN public.user_roles ur ON n.user_id = ur.user_id
WHERE n.is_read = false
  AND (
    ur.role IN ('admin', 'moderateur', 'superadmin')
    OR n.user_id IN (
      SELECT id FROM auth.users 
      WHERE email = 'barrymohamadou98@gmail.com'
    )
  )
GROUP BY n.user_id, ur.role
ORDER BY unread_count DESC;

