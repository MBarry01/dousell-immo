-- =====================================================
-- MIGRATION: AJOUT CHAMPS STRIPE AUX ÉQUIPES
-- Date: 2026-02-03
-- Objectif: Permettre le suivi des abonnements Stripe
-- =====================================================

-- 1. Ajouter les colonnes Stripe
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Index pour la recherche rapide (Webhooks)
CREATE INDEX IF NOT EXISTS idx_teams_stripe_customer 
ON teams(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_teams_stripe_subscription 
ON teams(stripe_subscription_id);

-- 3. Commentaires
COMMENT ON COLUMN teams.stripe_customer_id IS 'ID client Stripe (cus_...) pour les abonnements récurrents';
COMMENT ON COLUMN teams.stripe_subscription_id IS 'ID abonnement Stripe actif (sub_...)';
