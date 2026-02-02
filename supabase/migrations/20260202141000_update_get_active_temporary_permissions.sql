-- =====================================================
-- MIGRATION: Update get_active_temporary_permissions to include ID
-- Date: 2026-02-02
-- =====================================================

BEGIN;

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_active_temporary_permissions(UUID, UUID);

-- Recreate with ID field
CREATE OR REPLACE FUNCTION public.get_active_temporary_permissions(
    p_team_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    permission TEXT,
    expires_at TIMESTAMPTZ,
    granted_by UUID,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tp.id,
        tp.permission,
        tp.expires_at,
        tp.granted_by,
        tp.reason
    FROM public.temporary_permissions tp
    WHERE tp.team_id = p_team_id
    AND tp.user_id = p_user_id
    AND tp.expires_at > NOW()
    ORDER BY tp.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_active_temporary_permissions IS
'Récupère toutes les permissions temporaires actives (non expirées) d''un utilisateur dans une équipe';

COMMIT;

-- ✅ Migration terminée
