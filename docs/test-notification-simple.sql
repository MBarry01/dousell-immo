-- Test simple : Créer une notification pour le modérateur
-- Exécutez ce script dans Supabase SQL Editor
-- Remplacez USER_ID si nécessaire

-- USER_ID du modérateur (d'après les logs)
-- 5cd550d1-17c3-4e15-b4d6-40120098de33

-- Créer une notification de test
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  resource_path,
  is_read,
  created_at
) VALUES (
  '5cd550d1-17c3-4e15-b4d6-40120098de33',
  'info',
  '🧪 Test Notification',
  'Si vous voyez cette notification, le système fonctionne !',
  '/admin/moderation',
  false,
  now()
)
RETURNING 
  id, 
  user_id, 
  type, 
  title, 
  is_read, 
  created_at;

-- Vérifier immédiatement après insertion
SELECT 
  'Notifications pour ce user:' as info,
  id,
  user_id,
  type,
  title,
  is_read,
  created_at
FROM public.notifications
WHERE user_id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
ORDER BY created_at DESC
LIMIT 10;

