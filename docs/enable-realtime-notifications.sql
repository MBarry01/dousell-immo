-- Activer Realtime pour la table notifications
-- Exécutez ce script dans Supabase SQL Editor

-- Activer Realtime pour la table notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Vérifier que Realtime est activé
SELECT 
  'Realtime activé:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

