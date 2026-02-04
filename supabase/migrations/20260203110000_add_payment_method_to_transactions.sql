-- Migration: Add payment_method column to rental_transactions
-- Date: 2026-02-03
-- Description: Add payment_method column for tracking how payments were confirmed

ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_ref TEXT;

-- Add comments
COMMENT ON COLUMN rental_transactions.payment_method IS 'Méthode de paiement (ex: manual, stripe, transfer, kkiapay)';
COMMENT ON COLUMN rental_transactions.payment_ref IS 'Référence externe de transaction (ex: ID Stripe, ID Kkiapay)';

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_rental_transactions_payment_method 
ON rental_transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_rental_transactions_payment_ref 
ON rental_transactions(payment_ref);
