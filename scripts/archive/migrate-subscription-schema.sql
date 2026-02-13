/**
 * Migration Supabase: Subscription Team-Based
 * 
 * Objectif: Migrer l'abonnement de profiles vers teams
 * Date: 2026-02-02
 * 
 * IMPORTANT: Exécuter ce script sur Supabase Dashboard > SQL Editor
 */

-- =====================================================
-- ÉTAPE 1: AJOUT DES COLONNES DANS TEAMS
-- =====================================================

-- Colonnes d'abonnement
ALTER TABLE teams ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none' 
  CHECK (subscription_status IN ('none', 'trial', 'active', 'expired', 'canceled'));

ALTER TABLE teams ADD COLUMN IF NOT EXISTS subscription_trial_ends_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'pro' 
  CHECK (subscription_tier IN ('pro', 'premium', 'enterprise'));

-- Colonnes de facturation
ALTER TABLE teams ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' 
  CHECK (billing_cycle IN ('monthly', 'annual'));

-- ⚠️ CONTRAINTE CRITIQUE: Si l'abonnement est actif, le tier doit être défini
ALTER TABLE teams DROP CONSTRAINT IF EXISTS check_active_subscription_tier;
ALTER TABLE teams ADD CONSTRAINT check_active_subscription_tier
  CHECK (subscription_status != 'active' OR subscription_tier IS NOT NULL);

-- =====================================================
-- ÉTAPE 2: INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teams_subscription_status 
  ON teams(subscription_status);

CREATE INDEX IF NOT EXISTS idx_teams_subscription_expires 
  ON teams(subscription_trial_ends_at) 
  WHERE subscription_status = 'trial';

-- =====================================================
-- ÉTAPE 3: COMMENTAIRES (DOCUMENTATION)
-- =====================================================

COMMENT ON COLUMN teams.subscription_status IS 'Statut abonnement équipe: none (jamais activé), trial (14j gratuit), active (payé), expired (fin essai/paiement), canceled (annulé par user)';
COMMENT ON COLUMN teams.subscription_trial_ends_at IS 'Date de fin de la période d''essai (14 jours par défaut). Null si abonnement payé.';
COMMENT ON COLUMN teams.subscription_started_at IS 'Date de début de l''abonnement (création équipe ou activation Pro)';
COMMENT ON COLUMN teams.subscription_tier IS 'Tier actuel: pro (par défaut), premium, enterprise (futurs plans)';
COMMENT ON COLUMN teams.billing_email IS 'Email de facturation (peut différer de l''email du owner)';
COMMENT ON COLUMN teams.billing_cycle IS 'Cycle de facturation: monthly (mensuel) ou annual (annuel avec réduction)';

-- =====================================================
-- ÉTAPE 4: VALEURS PAR DÉFAUT POUR ÉQUIPES EXISTANTES
-- =====================================================

-- Pour les équipes déjà créées sans abonnement, donner un essai de 14 jours
UPDATE teams 
SET 
  subscription_status = 'trial',
  subscription_trial_ends_at = NOW() + INTERVAL '14 days',
  subscription_started_at = created_at,
  subscription_tier = 'pro'
WHERE subscription_status IS NULL OR subscription_status = 'none';

-- =====================================================
-- ÉTAPE 5: FONCTION HELPER (OPTIONNEL)
-- =====================================================

-- Fonction pour vérifier si une équipe a un abonnement actif
CREATE OR REPLACE FUNCTION is_team_subscription_active(team_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_id_param
    AND subscription_status IN ('trial', 'active')
    AND (
      subscription_status = 'active' 
      OR (subscription_status = 'trial' AND subscription_trial_ends_at > NOW())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_team_subscription_active IS 'Vérifie si l''équipe a un abonnement actif (trial non expiré ou active)';

-- =====================================================
-- ÉTAPE 6: RLS POLICIES (SI NÉCESSAIRE)
-- =====================================================

-- Permettre aux membres de l'équipe de voir le statut d'abonnement
-- (Déjà probablement couvert par les policies existantes sur teams)

-- =====================================================
-- RÉSUMÉ DE LA MIGRATION
-- =====================================================

-- Vérification finale
SELECT 
  COUNT(*) as total_teams,
  COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_teams,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_teams,
  COUNT(CASE WHEN subscription_status = 'expired' THEN 1 END) as expired_teams
FROM teams;

-- ✅ Migration SQL terminée
-- ⏭️ Prochaine étape: Exécuter scripts/migrate-subscription-to-teams.ts
