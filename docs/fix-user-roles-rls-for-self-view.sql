-- 🔧 FIX : Permettre aux utilisateurs de voir leurs propres rôles
-- Exécutez ce script dans Supabase SQL Editor

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

-- Créer une politique qui permet aux utilisateurs de voir leurs propres rôles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Vérifier que la politique existe
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname = 'user_roles_select_own';




