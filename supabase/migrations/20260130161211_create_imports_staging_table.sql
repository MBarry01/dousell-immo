-- Migration Phase 1 - Moteur de Staging
-- Creation de la table imports_staging pour la gestion des imports massifs

BEGIN;

CREATE TABLE IF NOT EXISTS public.imports_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    imported_by UUID NOT NULL REFERENCES public.profiles(id),
    
    -- Type de ressource (expense, lease, transaction)
    resource_type TEXT NOT NULL CHECK (resource_type IN ('expense', 'lease', 'transaction')),
    
    -- Données
    raw_data JSONB NOT NULL, -- Données brutes de l'import (CSV/Excel)
    standardized_data JSONB, -- Données après passage dans le moteur de normalisation
    
    -- État et Diagnostic
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'committed', 'rejected')),
    import_hash TEXT NOT NULL, -- SHA256(content + team_id) pour déduplication
    validation_errors JSONB DEFAULT '[]',
    
    -- Aide au matching (Fuzzy logic)
    match_score FLOAT DEFAULT 0,
    matched_resource_id UUID, -- ID d'un bail ou bien existant si matché
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons dans le même batch/équipe
    CONSTRAINT unique_import_per_team UNIQUE (team_id, import_hash)
);

-- Index pour la performance de la console d'import
CREATE INDEX idx_imports_staging_team_status ON public.imports_staging(team_id, status);
CREATE INDEX idx_imports_staging_hash ON public.imports_staging(import_hash);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_imports_staging_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_imports_staging_updated_at
    BEFORE UPDATE ON public.imports_staging
    FOR EACH ROW
    EXECUTE FUNCTION public.update_imports_staging_updated_at();

-- RLS
ALTER TABLE public.imports_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view imports for their team"
    ON public.imports_staging
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = imports_staging.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage imports for their team"
    ON public.imports_staging
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = imports_staging.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('owner', 'manager')
        )
    );

COMMIT;
