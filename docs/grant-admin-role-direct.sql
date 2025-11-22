-- 🔧 Script DIRECT pour accorder le rôle admin (une seule commande)
-- Exécutez ce script dans Supabase SQL Editor
-- Ce script insère directement le rôle admin en utilisant l'email

-- Insérer le rôle admin pour barrymohamadou98@gmail.com
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  u.id,
  'admin',
  u.id
FROM auth.users u
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING
RETURNING *;

-- Vérification
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
AND ur.role = 'admin';




