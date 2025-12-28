-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lease_decisions'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'lease_decisions';
