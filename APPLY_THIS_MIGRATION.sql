-- =====================================================
-- MIGRATION COMPLÈTE - Toutes les colonnes manquantes
-- =====================================================
-- Exécuter ce SQL dans le Supabase Dashboard > SQL Editor
-- Date: 2026-02-08
-- =====================================================

-- 1. COLONNES MANQUANTES sur rental_transactions
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_ref TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE,
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. COMMENTAIRES
COMMENT ON COLUMN rental_transactions.payment_method IS 'Méthode de paiement (ex: manual, stripe, transfer, kkiapay)';
COMMENT ON COLUMN rental_transactions.payment_ref IS 'Référence externe de transaction (ex: ID Stripe, ID Kkiapay)';
COMMENT ON COLUMN rental_transactions.amount_paid IS 'Montant réellement payé (en FCFA)';
COMMENT ON COLUMN rental_transactions.owner_id IS 'ID du propriétaire pour visibilité dashboard';
COMMENT ON COLUMN rental_transactions.meta IS 'Métadonnées JSON (provider, timestamp, etc.)';
COMMENT ON COLUMN rental_transactions.reminder_sent IS 'Si un rappel a été envoyé pour cette transaction';

-- 3. INDEXES pour les performances
CREATE INDEX IF NOT EXISTS idx_rental_transactions_payment_method 
ON rental_transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_rental_transactions_payment_ref 
ON rental_transactions(payment_ref);

CREATE INDEX IF NOT EXISTS idx_rental_transactions_owner_id
ON rental_transactions(owner_id);

-- 4. COLONNES MANQUANTES sur leases (team_id si pas présent)
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS team_id UUID,
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS tenant_access_token TEXT;

-- 5. team_id sur rental_transactions (si pas présent)
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS team_id UUID;

CREATE INDEX IF NOT EXISTS idx_rental_transactions_team_id 
ON rental_transactions(team_id);

-- 6. Backfill team_id sur les transactions existantes
UPDATE rental_transactions rt 
SET team_id = l.team_id 
FROM leases l 
WHERE rt.lease_id = l.id AND rt.team_id IS NULL;

-- 7. Vérification finale
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rental_transactions'
ORDER BY ordinal_position;
