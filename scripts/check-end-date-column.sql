-- ========================================
-- Script de vérification: Colonne end_date
-- ========================================

-- 1. Vérifier si la colonne existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leases'
AND column_name = 'end_date';

-- Si aucun résultat → La colonne n'existe PAS
-- Si 1 ligne → La colonne existe ✅

-- 2. Vérifier l'index
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leases'
AND indexname = 'idx_leases_end_date_status';

-- 3. Voir toutes les colonnes de la table leases
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leases'
ORDER BY ordinal_position;
