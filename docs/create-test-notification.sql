-- Script pour créer une notification de test pour un modérateur
-- Remplacez USER_ID par l'ID du modérateur (5cd550d1-17c3-4e15-b4d6-40120098de33)

-- 1. Vérifier que l'utilisateur existe et a le rôle modérateur
SELECT 
  'Utilisateur et rôle:' as info,
  u.id,
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '5cd550d1-17c3-4e15-b4d6-40120098de33';

-- 2. Créer une notification de test
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
  'Test Notification',
  'Ceci est une notification de test pour vérifier que le système fonctionne.',
  '/admin/moderation',
  false,
  now()
)
RETURNING id, user_id, title, created_at;

-- 3. Vérifier que la notification a été créée
SELECT 
  'Notification créée:' as info,
  id,
  user_id,
  type,
  title,
  is_read,
  created_at
FROM public.notifications
WHERE user_id = '5cd550d1-17c3-4e15-b4d6-40120098de33'
ORDER BY created_at DESC
LIMIT 5;




