-- 🔧 FIX SIMPLIFIÉ : Politique RLS ultra-simple pour user_roles
-- Cette version simplifie au maximum la vérification

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Désactiver temporairement RLS pour tester (à réactiver après)
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- OU créer une politique très permissive pour les admins
-- Politique 1: Les admins peuvent tout faire (basée sur email uniquement)
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    -- Vérifier l'email directement
    (SELECT LOWER(email) FROM auth.users WHERE id = auth.uid()) = 'barrymohamadou98@gmail.com'
  )
  WITH CHECK (
    (SELECT LOWER(email) FROM auth.users WHERE id = auth.uid()) = 'barrymohamadou98@gmail.com'
  );

-- Politique 2: Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Vérification
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
WHERE tablename = 'user_roles';

