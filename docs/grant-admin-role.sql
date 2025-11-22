-- 🔧 Script pour accorder le rôle admin à barrymohamadou98@gmail.com
-- Exécutez ce script dans Supabase SQL Editor

-- Étape 1: Récupérer l'UUID de l'utilisateur
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE LOWER(email) = 'barrymohamadou98@gmail.com';

-- Étape 2: Insérer le rôle admin directement (bypass RLS)
-- Remplacez 'VOTRE_UUID_ICI' par l'UUID récupéré à l'étape 1
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  u.id,
  'admin',
  u.id
FROM auth.users u
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING
RETURNING *;

-- Étape 3: Vérifier que le rôle a été créé
SELECT 
  ur.*,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com';




