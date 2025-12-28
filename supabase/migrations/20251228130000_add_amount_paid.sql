-- Migration: Add amount_paid column to rental_transactions
-- Date: 2025-12-28
-- Description: Track the actual amount paid for each transaction

ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN rental_transactions.amount_paid IS 'Montant réellement payé (en FCFA)';
