-- 🔧 ACCORDER LE RÔLE ADMIN À barrymohamadou98@gmail.com
-- Exécutez ce script dans Supabase SQL Editor
-- Ce script fait tout automatiquement : récupère l'UUID et insère le rôle

-- Étape 1: Afficher votre UUID (pour information)
SELECT 
  id as uuid,
  email,
  created_at
FROM auth.users
WHERE LOWER(email) = 'barrymohamadou98@gmail.com';

-- Étape 2: Insérer le rôle admin directement (bypass RLS en utilisant l'email)
-- Cette commande récupère automatiquement l'UUID et insère le rôle
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  u.id,
  'admin',
  u.id
FROM auth.users u
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING
RETURNING 
  id,
  user_id,
  role,
  created_at;

-- Étape 3: Vérifier que le rôle a été créé
SELECT 
  ur.id,
  ur.user_id as uuid,
  ur.role,
  ur.created_at,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
AND ur.role = 'admin';

