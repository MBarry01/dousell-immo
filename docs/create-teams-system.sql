-- =====================================================
-- MIGRATION: Système de Gestion des Équipes
-- Dousell Immo - Gestion Locative SaaS
-- Date: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. TABLE: teams (Équipes/Agences)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identité de l'équipe
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Branding (hérité du profil owner)
    logo_url TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_email TEXT,
    company_ninea TEXT,
    signature_url TEXT,

    -- Configuration
    billing_email TEXT,
    default_billing_day INTEGER DEFAULT 5,
    currency TEXT DEFAULT 'FCFA',

    -- Statut
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),

    -- Metadata
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.set_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
CREATE TRIGGER teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.set_teams_updated_at();

-- =====================================================
-- 2. TABLE: team_members (Association user-team)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Rôle dans l'équipe
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'manager', 'accountant', 'agent')),

    -- Permissions custom (JSON pour flexibilité)
    custom_permissions JSONB DEFAULT '{}',

    -- Statut
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),

    -- Metadata
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte d'unicité : un user = un rôle par équipe
    UNIQUE(team_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS team_members_updated_at ON public.team_members;
CREATE TRIGGER team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_teams_updated_at();

-- =====================================================
-- 3. TABLE: team_invitations (Invitations en attente)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

    -- Destinataire
    email TEXT NOT NULL,

    -- Rôle proposé
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('manager', 'accountant', 'agent')),

    -- Token sécurisé pour validation
    token UUID NOT NULL DEFAULT gen_random_uuid(),

    -- Expiration (7 jours par défaut)
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- Statut
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),

    -- Metadata
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- Contrainte unique partielle : une seule invitation pending par email/équipe
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique_pending
ON public.team_invitations(team_id, email)
WHERE status = 'pending';

-- =====================================================
-- 4. TABLE: team_audit_logs (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Action
    action TEXT NOT NULL,
    -- Valeurs possibles : 'team.created', 'team.updated', 'member.invited',
    -- 'member.joined', 'member.role_changed', 'member.removed',
    -- 'invitation.cancelled', 'settings.updated', etc.

    -- Détails
    resource_type TEXT,
    resource_id UUID,

    -- Données avant/après
    old_data JSONB,
    new_data JSONB,

    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche chronologique
CREATE INDEX IF NOT EXISTS idx_team_audit_logs_team_id ON public.team_audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_logs_user_id ON public.team_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_logs_action ON public.team_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_team_audit_logs_created_at ON public.team_audit_logs(created_at DESC);

-- =====================================================
-- 5. MODIFICATION: Ajout team_id à leases
-- =====================================================
ALTER TABLE public.leases
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leases_team_id ON public.leases(team_id);

-- =====================================================
-- 6. RLS POLICIES: teams
-- =====================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Les membres peuvent voir leur équipe
DROP POLICY IF EXISTS "Members can view their team" ON public.teams;
CREATE POLICY "Members can view their team"
ON public.teams FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
);

-- Seuls les owners peuvent modifier l'équipe
DROP POLICY IF EXISTS "Owners can update their team" ON public.teams;
CREATE POLICY "Owners can update their team"
ON public.teams FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
        AND team_members.status = 'active'
    )
);

-- Tout utilisateur connecté peut créer une équipe
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. RLS POLICIES: team_members
-- =====================================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Les membres peuvent voir les autres membres de leur équipe
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
CREATE POLICY "Members can view team members"
ON public.team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members AS tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- Owners et Managers peuvent ajouter des membres
DROP POLICY IF EXISTS "Owners and Managers can add members" ON public.team_members;
CREATE POLICY "Owners and Managers can add members"
ON public.team_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members AS tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager')
        AND tm.status = 'active'
    )
    OR
    -- Permettre l'auto-insertion du créateur comme owner
    (team_members.user_id = auth.uid() AND team_members.role = 'owner')
);

-- Owners peuvent modifier les membres
DROP POLICY IF EXISTS "Owners can manage members" ON public.team_members;
CREATE POLICY "Owners can manage members"
ON public.team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members AS tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
        AND tm.status = 'active'
    )
);

-- Owners peuvent supprimer les membres (sauf le dernier owner)
DROP POLICY IF EXISTS "Owners can remove members" ON public.team_members;
CREATE POLICY "Owners can remove members"
ON public.team_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members AS tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'owner'
        AND tm.status = 'active'
    )
    AND NOT (
        team_members.role = 'owner'
        AND (
            SELECT COUNT(*) FROM public.team_members
            WHERE team_id = team_members.team_id
            AND role = 'owner'
            AND status = 'active'
        ) <= 1
    )
);

-- =====================================================
-- 8. RLS POLICIES: team_invitations
-- =====================================================
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Membres peuvent voir les invitations de leur équipe
DROP POLICY IF EXISTS "Members can view team invitations" ON public.team_invitations;
CREATE POLICY "Members can view team invitations"
ON public.team_invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
    OR
    -- L'invité peut voir son invitation via le token
    team_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Owners et Managers peuvent créer des invitations
DROP POLICY IF EXISTS "Owners and Managers can create invitations" ON public.team_invitations;
CREATE POLICY "Owners and Managers can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'manager')
        AND team_members.status = 'active'
    )
);

-- Owners et Managers peuvent annuler des invitations
DROP POLICY IF EXISTS "Owners and Managers can cancel invitations" ON public.team_invitations;
CREATE POLICY "Owners and Managers can cancel invitations"
ON public.team_invitations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'manager')
        AND team_members.status = 'active'
    )
);

-- =====================================================
-- 9. RLS POLICIES: team_audit_logs
-- =====================================================
ALTER TABLE public.team_audit_logs ENABLE ROW LEVEL SECURITY;

-- Membres peuvent voir les logs de leur équipe
DROP POLICY IF EXISTS "Members can view team audit logs" ON public.team_audit_logs;
CREATE POLICY "Members can view team audit logs"
ON public.team_audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = team_audit_logs.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
);

-- Insertion autorisée pour les membres actifs
DROP POLICY IF EXISTS "Members can insert audit logs" ON public.team_audit_logs;
CREATE POLICY "Members can insert audit logs"
ON public.team_audit_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = team_audit_logs.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
);

-- =====================================================
-- 10. RLS POLICIES: leases (mise à jour)
-- =====================================================

-- Ajouter policy pour accès équipe aux baux
DROP POLICY IF EXISTS "Team members can view team leases" ON public.leases;
CREATE POLICY "Team members can view team leases"
ON public.leases FOR SELECT
USING (
    -- Mode solo (ancien comportement)
    (team_id IS NULL AND owner_id = auth.uid())
    OR
    -- Mode équipe
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = leases.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
);

-- =====================================================
-- 11. FONCTIONS HELPER (SECURITY DEFINER)
-- =====================================================

-- Fonction pour récupérer l'équipe d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_team(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_slug TEXT,
    user_role TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.slug AS team_slug,
        tm.role AS user_role
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = p_user_id
    AND tm.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
$$;

-- Fonction pour vérifier une permission d'équipe
CREATE OR REPLACE FUNCTION public.has_team_permission(
    p_team_id UUID,
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Récupérer le rôle de l'utilisateur dans l'équipe
    SELECT role INTO v_role
    FROM team_members
    WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND status = 'active';

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Owner a toutes les permissions
    IF v_role = 'owner' THEN
        RETURN TRUE;
    END IF;

    -- Vérifier les permissions par rôle
    RETURN CASE p_permission
        -- Équipe
        WHEN 'team.settings.view' THEN v_role IN ('owner', 'manager')
        WHEN 'team.settings.edit' THEN v_role = 'owner'
        WHEN 'team.members.view' THEN TRUE
        WHEN 'team.members.invite' THEN v_role IN ('owner', 'manager')
        WHEN 'team.members.edit_role' THEN v_role = 'owner'
        WHEN 'team.members.remove' THEN v_role = 'owner'
        WHEN 'team.audit.view' THEN v_role IN ('owner', 'manager')

        -- Baux
        WHEN 'leases.view' THEN TRUE
        WHEN 'leases.create' THEN v_role IN ('owner', 'manager')
        WHEN 'leases.edit' THEN v_role IN ('owner', 'manager')
        WHEN 'leases.terminate' THEN v_role IN ('owner', 'manager')
        WHEN 'leases.delete' THEN v_role = 'owner'

        -- Paiements
        WHEN 'payments.view' THEN v_role IN ('owner', 'manager', 'accountant')
        WHEN 'payments.confirm' THEN v_role IN ('owner', 'manager', 'accountant')
        WHEN 'payments.void' THEN v_role IN ('owner', 'accountant')
        WHEN 'receipts.generate' THEN v_role IN ('owner', 'manager', 'accountant')
        WHEN 'reports.financial.view' THEN v_role IN ('owner', 'accountant')
        WHEN 'reports.financial.export' THEN v_role IN ('owner', 'accountant')
        WHEN 'expenses.view' THEN v_role IN ('owner', 'accountant')
        WHEN 'expenses.create' THEN v_role IN ('owner', 'accountant')
        WHEN 'expenses.edit' THEN v_role IN ('owner', 'accountant')

        -- Maintenance
        WHEN 'maintenance.view' THEN v_role IN ('owner', 'manager', 'agent')
        WHEN 'maintenance.create' THEN v_role IN ('owner', 'manager', 'agent')
        WHEN 'maintenance.approve_quote' THEN v_role IN ('owner', 'manager')
        WHEN 'maintenance.complete' THEN v_role IN ('owner', 'manager')

        -- Documents
        WHEN 'documents.view' THEN TRUE
        WHEN 'documents.generate' THEN v_role IN ('owner', 'manager', 'accountant')
        WHEN 'documents.delete' THEN v_role = 'owner'

        -- Locataires
        WHEN 'tenants.view' THEN TRUE
        WHEN 'tenants.contact' THEN v_role IN ('owner', 'manager', 'agent')
        WHEN 'tenants.edit' THEN v_role IN ('owner', 'manager')

        ELSE FALSE
    END;
END;
$$;

-- Fonction pour accepter une invitation (bypass RLS)
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_user_email TEXT;
    v_result JSONB;
BEGIN
    -- Récupérer l'utilisateur connecté
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Non connecté');
    END IF;

    -- Récupérer l'email de l'utilisateur
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- Récupérer l'invitation
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE token = p_token
    AND status = 'pending';

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation invalide ou expirée');
    END IF;

    -- Vérifier l'email
    IF LOWER(v_invitation.email) != LOWER(v_user_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cette invitation n''est pas destinée à votre compte');
    END IF;

    -- Vérifier l'expiration
    IF v_invitation.expires_at < NOW() THEN
        UPDATE team_invitations SET status = 'expired' WHERE id = v_invitation.id;
        RETURN jsonb_build_object('success', false, 'error', 'Cette invitation a expiré');
    END IF;

    -- Ajouter comme membre
    INSERT INTO team_members (team_id, user_id, role, status, invited_by, joined_at)
    VALUES (v_invitation.team_id, v_user_id, v_invitation.role, 'active', v_invitation.invited_by, NOW())
    ON CONFLICT (team_id, user_id) DO NOTHING;

    -- Marquer l'invitation comme acceptée
    UPDATE team_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;

    -- Récupérer le nom de l'équipe pour le retour
    SELECT jsonb_build_object(
        'success', true,
        'team_id', v_invitation.team_id,
        'team_name', t.name,
        'role', v_invitation.role
    ) INTO v_result
    FROM teams t
    WHERE t.id = v_invitation.team_id;

    RETURN v_result;
END;
$$;

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.get_user_team(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_team_permission(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(UUID) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

COMMENT ON TABLE public.teams IS 'Équipes/Agences pour la gestion locative multi-utilisateurs';
COMMENT ON TABLE public.team_members IS 'Association utilisateurs-équipes avec rôles';
COMMENT ON TABLE public.team_invitations IS 'Invitations en attente pour rejoindre une équipe';
COMMENT ON TABLE public.team_audit_logs IS 'Journal d''audit des actions sur les équipes';
