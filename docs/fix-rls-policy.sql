-- Script SQL pour corriger la politique RLS user_roles
-- À exécuter dans Supabase SQL Editor si vous avez l'erreur "Permission refusée"
-- Version corrigée avec (SELECT auth.uid()) pour une meilleure compatibilité

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Créer la nouvelle politique avec vérification email en premier
-- Cela permet au premier admin (barrymohamadou98@gmail.com) de créer des rôles
-- même s'il n'a pas encore de rôle dans la table user_roles
-- Utilise (SELECT auth.uid()) pour une meilleure compatibilité avec Supabase
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

-- Vérifier que la politique est bien créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname = 'Admins can manage roles';

