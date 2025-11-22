-- Script SQL idempotent pour corriger les RLS et activer Realtime pour notifications
-- Exécutez ce script dans Supabase SQL Editor
-- Ce script peut être exécuté plusieurs fois sans erreur

-- ============================================================================
-- 1. Activer Realtime pour la table notifications (si pas déjà fait)
-- ============================================================================
DO $$
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Realtime activé pour la table notifications';
  ELSE
    RAISE NOTICE 'Realtime déjà activé pour la table notifications';
  END IF;
END $$;

-- ============================================================================
-- 2. Supprimer les anciennes policies si elles existent
-- ============================================================================
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- ============================================================================
-- 3. Créer les nouvelles policies RLS
-- ============================================================================

-- Politique : Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Permettre l'insertion de notifications pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique : Service role peut tout faire (pour bypasser RLS côté serveur)
CREATE POLICY "Service role full access"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. Vérification
-- ============================================================================

-- Vérifier que Realtime est activé
SELECT 
  '✅ Realtime activé:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- Vérifier les policies créées
SELECT 
  '✅ Policies créées:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;




