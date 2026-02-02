/**
 * Mise à jour de la fonction RPC get_user_team pour inclure subscription
 * 
 * À exécuter sur Supabase Dashboard > SQL Editor
 */

-- =====================================================
-- MISE À JOUR: get_user_team RPC
-- =====================================================

-- Supprimer la fonction existante (nécessaire pour changer le type de retour)
DROP FUNCTION IF EXISTS get_user_team(UUID);

-- Recréer avec les nouveaux champs subscription
CREATE OR REPLACE FUNCTION get_user_team(p_user_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_slug TEXT,
  user_role TEXT,
  subscription_status TEXT,
  subscription_trial_ends_at TIMESTAMPTZ,
  subscription_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    t.slug as team_slug,
    tm.role as user_role,
    t.subscription_status,
    t.subscription_trial_ends_at,
    t.subscription_tier
  FROM team_members tm
  INNER JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  AND tm.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_team IS 'Récupère l''équipe active de l''utilisateur avec infos d''abonnement (bypass RLS)';

-- ✅ RPC mise à jour
