-- Corriger les RLS policies pour la table notifications
-- Exécutez ce script dans Supabase SQL Editor

-- Activer Realtime pour la table notifications (si pas déjà fait)
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
  END IF;
END $$;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

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
-- (nécessaire pour que le serveur puisse créer des notifications)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Permettre l'insertion pour tous les utilisateurs authentifiés

-- Politique : Service role peut tout faire (pour bypasser RLS côté serveur)
CREATE POLICY "Service role full access"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Vérifier que Realtime est activé
SELECT 
  'Realtime activé:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- Vérifier les policies
SELECT 
  'Policies créées:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications';

