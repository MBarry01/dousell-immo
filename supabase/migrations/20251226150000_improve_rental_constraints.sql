-- Migration: Add constraints and improvements to rental system
-- Date: 2025-12-26
-- Description: Add CHECK constraints and adjust decimal precision

-- Activer l'extension pour les UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modifier les colonnes pour ajouter la précision DECIMAL(12,2)
ALTER TABLE leases 
  ALTER COLUMN monthly_amount TYPE DECIMAL(12,2);

ALTER TABLE rental_transactions 
  ALTER COLUMN amount_due TYPE DECIMAL(12,2);

ALTER TABLE maintenance_requests 
  ALTER COLUMN quote_amount TYPE DECIMAL(12,2);

-- Ajouter les contraintes CHECK pour leases
ALTER TABLE leases
  ADD CONSTRAINT billing_day_range CHECK (billing_day >= 1 AND billing_day <= 31),
  ADD CONSTRAINT status_valid CHECK (status IN ('active', 'terminated', 'pending_signature'));

-- Ajouter les contraintes CHECK pour rental_transactions
ALTER TABLE rental_transactions
  ADD CONSTRAINT transaction_status_valid CHECK (status IN ('pending', 'paid', 'overdue'));

-- Ajouter les contraintes CHECK pour maintenance_requests
ALTER TABLE maintenance_requests
  ADD CONSTRAINT maintenance_status_valid CHECK (status IN ('open', 'quote_received', 'approved', 'completed'));

-- Supprimer la colonne end_date si elle existe (pas dans le nouveau spec)
ALTER TABLE leases
  DROP COLUMN IF EXISTS end_date;

-- Supprimer la colonne category si elle existe (pas dans le nouveau spec)
ALTER TABLE maintenance_requests
  DROP COLUMN IF EXISTS category;
