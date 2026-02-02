-- Migration V4.5.2 - Unification Totale
-- Correction team_id sur TOUTES les tables (Properties, Leases, Expenses, Transactions)

BEGIN;

-- 1. Backup de sécurité (Tables temporaires)
CREATE TABLE IF NOT EXISTS public._migration_backup_v4_5_2_prop AS SELECT * FROM public.properties;
CREATE TABLE IF NOT EXISTS public._migration_backup_v4_5_2_lease AS SELECT * FROM public.leases;
CREATE TABLE IF NOT EXISTS public._migration_backup_v4_5_2_exp AS SELECT * FROM public.expenses;
CREATE TABLE IF NOT EXISTS public._migration_backup_v4_5_2_trans AS SELECT * FROM public.rental_transactions;

-- 2. Ajout des colonnes updated_at si manquantes (pour éviter les erreurs de triggers record "new")
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rental_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ajout des nouvelles colonnes
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA',
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'other';

ALTER TABLE public.rental_transactions 
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA',
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- 4. ÉTAPE CRUCIALE : Backfill team_id sur PROPERTIES et LEASES d'abord
-- On rattache au premier team_id trouvé pour le propriétaire
UPDATE public.properties p
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = p.owner_id 
  LIMIT 1
)
WHERE p.team_id IS NULL;

UPDATE public.leases l
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = l.owner_id 
  LIMIT 1
)
WHERE l.team_id IS NULL;

-- 5. Backfill EXPENSES & TRANSACTIONS via Leases
UPDATE public.expenses e
SET team_id = l.team_id
FROM public.leases l
WHERE e.lease_id = l.id AND e.team_id IS NULL;

UPDATE public.rental_transactions rt
SET team_id = l.team_id
FROM public.leases l
WHERE rt.lease_id = l.id AND rt.team_id IS NULL;

-- 6. Nettoyage final pour les vrais orphelins (sans lease_id)
UPDATE public.expenses e
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = e.owner_id 
  LIMIT 1
)
WHERE e.team_id IS NULL;

-- 7. Fallback de secours (Caisse Générale System)
-- Si vraiment aucun team_id n'est trouvé, on utilise un team_id par défaut ou on laisse passer
-- (Mais ici on va forcer une valeur pour que le NOT NULL passe si un team existe dans le système)
UPDATE public.rental_transactions rt
SET team_id = (
    SELECT id FROM public.teams LIMIT 1
)
WHERE rt.team_id IS NULL;

UPDATE public.expenses e
SET team_id = (
    SELECT id FROM public.teams LIMIT 1
)
WHERE e.team_id IS NULL;

-- 8. Initialisation Meta
UPDATE public.expenses 
SET meta = jsonb_build_object(
  'original_owner_id', owner_id,
  'migrated_at', NOW(),
  'user_corrections', '[]'::jsonb
)
WHERE meta = '{}';

UPDATE public.rental_transactions 
SET meta = jsonb_build_object(
  'migrated_at', NOW(),
  'user_corrections', '[]'::jsonb
)
WHERE meta = '{}';

-- 9. Appliquer les contraintes NOT NULL
ALTER TABLE public.expenses ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE public.rental_transactions ALTER COLUMN team_id SET NOT NULL;

-- 10. Foreign Keys & Indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_team_id_fkey') THEN
        ALTER TABLE public.expenses ADD CONSTRAINT expenses_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rental_transactions_team_id_fkey') THEN
        ALTER TABLE public.rental_transactions ADD CONSTRAINT rental_transactions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_team_id ON public.expenses(team_id);
CREATE INDEX IF NOT EXISTS idx_rental_transactions_team_id ON public.rental_transactions(team_id);

COMMIT;
