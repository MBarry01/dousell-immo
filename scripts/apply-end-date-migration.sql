-- Migration: Ajouter end_date à la table leases
-- Appliquer ce script dans l'éditeur SQL de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- 1. Ajouter la colonne end_date si elle n'existe pas
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Ajouter un commentaire explicatif
COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';

-- 3. Créer un index pour optimiser les requêtes du cron job
CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;

-- 4. (Optionnel) Remplir end_date pour les baux existants
-- Si vous avez une durée de bail standard (ex: 2 ans), décommentez:
-- UPDATE leases
-- SET end_date = start_date + INTERVAL '2 years'
-- WHERE end_date IS NULL AND start_date IS NOT NULL;

-- 5. Vérifier que la colonne a été créée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leases' AND column_name = 'end_date';

-- Résultat attendu:
-- column_name | data_type | is_nullable
-- ------------|-----------|------------
-- end_date    | date      | YES
