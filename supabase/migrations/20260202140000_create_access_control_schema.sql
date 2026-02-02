-- =====================================================
-- MIGRATION: Access Control System (Temporary Permissions)
-- Date: 2026-02-02
-- =====================================================
-- Objectif: Permettre aux membres de demander des accès temporaires
-- à des fonctionnalités hors de leur rôle habituel

BEGIN;

-- =====================================================
-- 1. TABLE: ACCESS_REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_permission TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),

    --審批信息
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Temporal info
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Si approved, quand l'accès expire

    -- Métadonnées
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_access_requests_team_id ON public.access_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester_id ON public.access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_requests_expires_at ON public.access_requests(expires_at) WHERE status = 'approved';

-- =====================================================
-- 2. TABLE: TEMPORARY_PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.temporary_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,

    -- Granted by
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,

    -- Lien vers la demande d'accès (optionnel)
    access_request_id UUID REFERENCES public.access_requests(id),

    -- Métadonnées
    reason TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contrainte unique: un user ne peut avoir qu'une seule permission temporaire active à la fois
    UNIQUE(team_id, user_id, permission)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_team_id ON public.temporary_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_user_id ON public.temporary_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_permissions_expires_at ON public.temporary_permissions(expires_at);

-- =====================================================
-- 3. FONCTION: CHECK_TEMPORARY_PERMISSION
-- =====================================================

-- Vérifie si un user a une permission temporaire active
CREATE OR REPLACE FUNCTION public.has_temporary_permission(
    p_team_id UUID,
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.temporary_permissions
        WHERE team_id = p_team_id
        AND user_id = p_user_id
        AND permission = p_permission
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_temporary_permission IS
'Vérifie si un utilisateur a une permission temporaire active (non expirée)';

-- =====================================================
-- 4. FONCTION: GET_ACTIVE_TEMPORARY_PERMISSIONS
-- =====================================================

-- Récupère toutes les permissions temporaires actives d'un user dans une équipe
CREATE OR REPLACE FUNCTION public.get_active_temporary_permissions(
    p_team_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    permission TEXT,
    expires_at TIMESTAMPTZ,
    granted_by UUID,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
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

-- =====================================================
-- 5. FONCTION: CLEANUP_EXPIRED_PERMISSIONS
-- =====================================================

-- Nettoie les permissions expirées (à exécuter via CRON ou manuellement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_permissions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.temporary_permissions
    WHERE expires_at <= NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_permissions IS
'Supprime toutes les permissions temporaires expirées. Retourne le nombre de lignes supprimées.';

-- =====================================================
-- 6. TRIGGER: AUTO-EXPIRE ACCESS REQUESTS
-- =====================================================

-- Fonction trigger pour marquer les demandes comme expirées
CREATE OR REPLACE FUNCTION public.auto_expire_access_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la permission temporaire expire, marquer la demande comme expirée
    IF TG_OP = 'DELETE' AND OLD.expires_at <= NOW() THEN
        UPDATE public.access_requests
        SET status = 'expired'
        WHERE id = OLD.access_request_id
        AND status = 'approved';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur suppression de temporary_permissions
DROP TRIGGER IF EXISTS trigger_auto_expire_access_requests ON public.temporary_permissions;
CREATE TRIGGER trigger_auto_expire_access_requests
    AFTER DELETE ON public.temporary_permissions
    FOR EACH ROW
    WHEN (OLD.access_request_id IS NOT NULL)
    EXECUTE FUNCTION public.auto_expire_access_requests();

-- =====================================================
-- 7. TRIGGER: UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_access_requests_updated_at ON public.access_requests;
CREATE TRIGGER trigger_update_access_requests_updated_at
    BEFORE UPDATE ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_access_requests_updated_at();

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_permissions ENABLE ROW LEVEL SECURITY;

-- Access Requests: Les membres de l'équipe peuvent voir les demandes de leur équipe
CREATE POLICY "team_members_view_access_requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Access Requests: Les membres peuvent créer des demandes pour leur équipe
CREATE POLICY "team_members_create_access_requests"
ON public.access_requests FOR INSERT
TO authenticated
WITH CHECK (
    requester_id = auth.uid()
    AND team_id IN (
        SELECT team_id FROM public.team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Access Requests: Seuls owners/managers peuvent approuver/rejeter
CREATE POLICY "owners_managers_update_access_requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'manager')
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'manager')
    )
);

-- Temporary Permissions: Les membres peuvent voir leurs propres permissions temporaires
CREATE POLICY "users_view_own_temporary_permissions"
ON public.temporary_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Temporary Permissions: Les owners/managers peuvent voir toutes les permissions de leur équipe
CREATE POLICY "owners_managers_view_temporary_permissions"
ON public.temporary_permissions FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'manager')
    )
);

-- Temporary Permissions: Seuls owners/managers peuvent accorder des permissions temporaires
-- (INSERT/DELETE via Server Actions avec Admin Client pour bypass RLS)

-- =====================================================
-- 9. COMMENTAIRES (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE public.access_requests IS
'Demandes d''accès temporaire à des fonctionnalités hors du rôle habituel';

COMMENT ON TABLE public.temporary_permissions IS
'Permissions temporaires accordées aux membres de l''équipe (expire après durée définie)';

COMMENT ON COLUMN public.access_requests.requested_permission IS
'Clé de permission demandée (ex: "leases.edit", "expenses.approve")';

COMMENT ON COLUMN public.temporary_permissions.permission IS
'Clé de permission accordée temporairement';

COMMENT ON COLUMN public.temporary_permissions.expires_at IS
'Date d''expiration de la permission temporaire (obligatoire)';

COMMIT;

-- =====================================================
-- RÉSUMÉ
-- =====================================================

-- Vérification finale
SELECT
    COUNT(*) as total_access_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests
FROM public.access_requests;

SELECT
    COUNT(*) as total_temporary_permissions,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_permissions
FROM public.temporary_permissions;

-- ✅ Migration SQL terminée
-- ⏭️ Prochaine étape: Créer les Server Actions et composants React
