-- =====================================================
-- MIGRATION: Ajout team_id aux propriétés
-- Dousell Immo - Gestion des Biens par Équipe
-- Date: 2026-01-24
-- =====================================================

-- =====================================================
-- 1. AJOUT DE LA COLONNE team_id
-- =====================================================

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Colonne pour publication programmée
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_properties_team_id ON public.properties(team_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON public.properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_scheduled_publish ON public.properties(scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND validation_status = 'scheduled';

-- =====================================================
-- 2. RLS POLICIES POUR ACCÈS ÉQUIPE
-- =====================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Team members can view team properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners and managers can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners and managers can update properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners can delete properties" ON public.properties;

-- Policy SELECT: Membres peuvent voir les biens de leur équipe
CREATE POLICY "Team members can view team properties"
ON public.properties FOR SELECT
USING (
    -- Mode solo (propriétaire individuel)
    (team_id IS NULL AND owner_id = auth.uid())
    OR
    -- Mode équipe
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = properties.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
    OR
    -- Biens publiés visibles par tous
    (validation_status = 'approved' AND status = 'disponible')
);

-- Policy INSERT: Owners/Managers peuvent créer des biens
CREATE POLICY "Team owners and managers can insert properties"
ON public.properties FOR INSERT
WITH CHECK (
    -- Mode solo
    (team_id IS NULL AND owner_id = auth.uid())
    OR
    -- Mode équipe (owner ou manager)
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = properties.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'manager')
        AND team_members.status = 'active'
    )
);

-- Policy UPDATE: Owners/Managers peuvent modifier les biens
CREATE POLICY "Team owners and managers can update properties"
ON public.properties FOR UPDATE
USING (
    -- Mode solo
    (team_id IS NULL AND owner_id = auth.uid())
    OR
    -- Mode équipe
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = properties.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'manager')
        AND team_members.status = 'active'
    )
);

-- Policy DELETE: Seuls les owners peuvent supprimer
CREATE POLICY "Team owners can delete properties"
ON public.properties FOR DELETE
USING (
    -- Mode solo
    (team_id IS NULL AND owner_id = auth.uid())
    OR
    -- Mode équipe (owner uniquement)
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = properties.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'owner'
        AND team_members.status = 'active'
    )
);

-- =====================================================
-- 3. FONCTION HELPER: Récupérer les biens d'une équipe
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_team_properties(p_team_id UUID)
RETURNS SETOF public.properties
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM properties
    WHERE team_id = p_team_id
    ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_properties(UUID) TO authenticated;

-- =====================================================
-- 4. FONCTION: Publication automatique des biens programmés
-- À appeler via pg_cron ou trigger externe (ex: toutes les minutes)
-- =====================================================

CREATE OR REPLACE FUNCTION public.publish_scheduled_properties()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    published_count INTEGER;
BEGIN
    UPDATE properties
    SET
        validation_status = 'approved',
        verification_status = 'verified',
        scheduled_publish_at = NULL,
        updated_at = NOW()
    WHERE
        validation_status = 'scheduled'
        AND scheduled_publish_at IS NOT NULL
        AND scheduled_publish_at <= NOW();

    GET DIAGNOSTICS published_count = ROW_COUNT;

    RETURN published_count;
END;
$$;

-- Permettre l'exécution depuis un service account ou cron
GRANT EXECUTE ON FUNCTION public.publish_scheduled_properties() TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_properties() TO service_role;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

COMMENT ON COLUMN public.properties.team_id IS 'Équipe propriétaire du bien (null = propriétaire individuel)';
COMMENT ON COLUMN public.properties.created_by IS 'Utilisateur ayant créé le bien';
COMMENT ON COLUMN public.properties.scheduled_publish_at IS 'Date/heure de publication programmée (null = immédiat ou brouillon)';
