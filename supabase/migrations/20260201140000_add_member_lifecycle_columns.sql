-- =====================================================
-- MIGRATION: Ajout des colonnes de cycle de vie des membres
-- Date: 2026-02-01
-- =====================================================
-- Ajoute les colonnes removed_at et left_at pour tracker
-- quand un membre quitte ou est retiré de l'équipe

BEGIN;

-- Ajouter les colonnes de cycle de vie
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter un index pour les performances (queries qui filtrent sur status)
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status) WHERE status = 'active';

-- Ajouter une contrainte CHECK pour les statuts valides
-- Note: On garde flexible pour permettre removed/left même si pas dans l'enum initial
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_status_check;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_status_check
CHECK (status IN ('active', 'suspended', 'invited', 'removed', 'left'));

-- Fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour team_members
DROP TRIGGER IF EXISTS team_members_updated_at_trigger ON public.team_members;
CREATE TRIGGER team_members_updated_at_trigger
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_members_updated_at();

COMMIT;
