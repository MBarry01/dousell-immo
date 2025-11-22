-- 🔧 FIX RAPIDE : Corriger la politique RLS pour user_roles
-- Copiez-collez ce script dans Supabase SQL Editor et exécutez-le

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Créer la nouvelle politique corrigée
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    (
      -- Autoriser si l'utilisateur a l'email du super-admin
      (SELECT LOWER(u.email) FROM auth.users u WHERE u.id = (SELECT auth.uid())) = 'barrymohamadou98@gmail.com'
    )
    OR
    (
      -- Ou si l'utilisateur a déjà le rôle admin dans user_roles
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role = 'admin'
      )
    )
  )
  WITH CHECK (
    (
      (SELECT LOWER(u.email) FROM auth.users u WHERE u.id = (SELECT auth.uid())) = 'barrymohamadou98@gmail.com'
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role = 'admin'
      )
    )
  );

-- Vérification : Afficher la politique créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname = 'Admins can manage roles';

