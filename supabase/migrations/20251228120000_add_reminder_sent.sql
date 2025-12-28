-- Migration: Add reminder_sent column to rental_transactions
-- Date: 2025-12-28
-- Description: Track if a late payment reminder has been sent

ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
