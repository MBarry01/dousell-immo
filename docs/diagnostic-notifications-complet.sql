-- Script de diagnostic complet pour les notifications
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================================================
-- 1. VÉRIFIER LES MODÉRATEURS ET ADMINS
-- ============================================================================
SELECT 
  '1. Modérateurs et Admins:' as section,
  ur.user_id,
  ur.role,
  u.email,
  ur.created_at as role_created_at
FROM public.user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role IN ('admin', 'moderateur', 'superadmin')
ORDER BY ur.role, ur.created_at DESC;

-- ============================================================================
-- 2. VÉRIFIER L'ADMIN PRINCIPAL (même sans rôle dans user_roles)
-- ============================================================================
SELECT 
  '2. Admin principal:' as section,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'barrymohamadou98@gmail.com';

-- ============================================================================
-- 3. VÉRIFIER LES NOTIFICATIONS RÉCENTES
-- ============================================================================
SELECT 
  '3. Notifications récentes:' as section,
  n.id,
  n.user_id,
  u.email as user_email,
  n.type,
  n.title,
  n.is_read,
  n.created_at,
  ur.role as user_role
FROM public.notifications n
LEFT JOIN auth.users u ON n.user_id = u.id
LEFT JOIN public.user_roles ur ON n.user_id = ur.user_id
WHERE ur.role IN ('admin', 'moderateur', 'superadmin')
   OR u.email = 'barrymohamadou98@gmail.com'
ORDER BY n.created_at DESC
LIMIT 20;

-- ============================================================================
-- 4. COMPTER LES NOTIFICATIONS PAR UTILISATEUR (modérateurs/admins)
-- ============================================================================
SELECT 
  '4. Compteur de notifications:' as section,
  n.user_id,
  u.email,
  ur.role,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE n.is_read = false) as unread_count,
  MAX(n.created_at) as last_notification
FROM public.notifications n
LEFT JOIN auth.users u ON n.user_id = u.id
LEFT JOIN public.user_roles ur ON n.user_id = ur.user_id
WHERE ur.role IN ('admin', 'moderateur', 'superadmin')
   OR u.email = 'barrymohamadou98@gmail.com'
GROUP BY n.user_id, u.email, ur.role
ORDER BY unread_count DESC, last_notification DESC;

-- ============================================================================
-- 5. VÉRIFIER QUE REALTIME EST ACTIVÉ
-- ============================================================================
SELECT 
  '5. Realtime activé:' as section,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- ============================================================================
-- 6. VÉRIFIER LES POLICIES RLS
-- ============================================================================
SELECT 
  '6. Policies RLS:' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================================================
-- 7. TEST: CRÉER UNE NOTIFICATION DE TEST POUR LE MODÉRATEUR
-- ============================================================================
-- Décommentez cette section pour créer une notification de test
/*
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  resource_path,
  is_read,
  created_at
) 
SELECT 
  '5cd550d1-17c3-4e15-b4d6-40120098de33',
  'info',
  'Test Notification',
  'Ceci est une notification de test pour vérifier que le système fonctionne.',
  '/admin/moderation',
  false,
  now()
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
)
RETURNING id, user_id, title, created_at;
*/

