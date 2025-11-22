-- 🔄 Activer Realtime pour la table user_roles
-- Exécutez ce script dans Supabase SQL Editor

-- Activer Realtime sur la table user_roles
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

-- Vérifier que Realtime est activé
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_roles';

-- Si la requête ci-dessus retourne une ligne, Realtime est activé ✅

