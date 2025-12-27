-- Migration: Ajouter period_start, period_end et tenant_id à rental_transactions
-- Date: 2025-12-27
-- Description: Enrichissement de la table pour alignement avec les spécifications Cron

-- 1. Ajouter les colonnes manquantes
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE,
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Ajouter la contrainte de clé étrangère pour tenant_id
-- Note: Le tenant_id peut être NULL temporairement pour les anciennes données
ALTER TABLE rental_transactions
ADD CONSTRAINT fk_rental_transactions_tenant
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Créer un index pour optimiser les recherches par tenant
CREATE INDEX IF NOT EXISTS idx_rental_transactions_tenant_id
ON rental_transactions(tenant_id);

-- 4. Créer un index composite pour les recherches par période
CREATE INDEX IF NOT EXISTS idx_rental_transactions_period_dates
ON rental_transactions(period_start, period_end);

-- 5. Ajouter un commentaire explicatif
COMMENT ON COLUMN rental_transactions.period_start IS 'Date de début de la période de location (ex: 2026-01-01)';
COMMENT ON COLUMN rental_transactions.period_end IS 'Date de fin de la période de location (ex: 2026-01-31)';
COMMENT ON COLUMN rental_transactions.tenant_id IS 'Référence directe au locataire (dénormalisé pour performance)';

-- 6. Migration des données existantes (peupler period_start et period_end)
-- Pour chaque transaction existante, calculer les dates basées sur period_month et period_year
UPDATE rental_transactions
SET
    period_start = make_date(period_year, period_month, 1),
    period_end = (make_date(period_year, period_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
WHERE period_start IS NULL AND period_year IS NOT NULL AND period_month IS NOT NULL;

-- 7. Migration du tenant_id basé sur le lease_id
-- Récupérer le tenant_id depuis la table leases (si la colonne existe)
-- Note: Cette partie dépend de votre schéma leases actuel
-- Si leases a un champ tenant_id, décommentez cette ligne:
-- UPDATE rental_transactions rt
-- SET tenant_id = l.tenant_id
-- FROM leases l
-- WHERE rt.lease_id = l.id AND rt.tenant_id IS NULL;

-- Alternative: Si vous stockez tenant_name dans leases et voulez le lier à profiles
-- Cette partie peut nécessiter un ajustement selon votre schéma exact
