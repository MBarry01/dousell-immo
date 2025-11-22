-- Test direct : Créer une notification pour le modérateur
-- Remplacez USER_ID par l'ID du modérateur si différent

-- 1. Vérifier que l'utilisateur modérateur existe
SELECT 
  'Utilisateur modérateur:' as info,
  u.id,
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
   OR ur.role = 'moderateur';

-- 2. Créer une notification de test directement (bypass RLS avec service role)
-- Note: Cette requête doit être exécutée avec les privilèges de service_role
-- ou via une fonction SECURITY DEFINER

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
  'Test Notification Directe',
  'Ceci est une notification de test créée directement dans la base de données.',
  '/admin/moderation',
  false,
  now()
WHERE EXISTS (
  SELECT 1 
  FROM auth.users 
  WHERE id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
)
RETURNING 
  id, 
  user_id, 
  type, 
  title, 
  is_read, 
  created_at;

-- 3. Vérifier que la notification a été créée
SELECT 
  'Notification créée:' as info,
  id,
  user_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM public.notifications
WHERE user_id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Vérifier Realtime
SELECT 
  'Realtime activé:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

