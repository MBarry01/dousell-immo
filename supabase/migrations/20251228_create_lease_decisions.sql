-- Migration: Table lease_decisions pour tracker les décisions du propriétaire
-- Date: 2025-12-28
-- Description: Permet au propriétaire de décider manuellement du renouvellement ou de la résiliation d'un bail

CREATE TABLE IF NOT EXISTS lease_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('renew', 'terminate')),

    -- Champs pour renouvellement
    new_end_date DATE, -- Nouvelle date de fin si renouvellement
    new_rent_amount NUMERIC, -- Nouveau montant si augmentation de loyer

    -- Champs pour résiliation
    termination_reason TEXT, -- Motif du congé (reprise, vente, motif légitime)
    notice_type TEXT CHECK (notice_type IN ('J-180', 'J-90')), -- Type de préavis envoyé
    notice_sent_at TIMESTAMPTZ, -- Date d'envoi du préavis
    notice_number TEXT, -- Numéro du préavis généré

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    decided_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT -- Notes optionnelles du propriétaire
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_lease_decisions_lease_id ON lease_decisions(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_decisions_decision_type ON lease_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_lease_decisions_created_at ON lease_decisions(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE lease_decisions ENABLE ROW LEVEL SECURITY;

-- Politique : Un propriétaire peut voir ses propres décisions
CREATE POLICY "Propriétaires peuvent voir leurs décisions"
    ON lease_decisions
    FOR SELECT
    USING (
        decided_by = auth.uid()
        OR
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- Politique : Un propriétaire peut créer des décisions pour ses baux
CREATE POLICY "Propriétaires peuvent créer des décisions"
    ON lease_decisions
    FOR INSERT
    WITH CHECK (
        decided_by = auth.uid()
        AND
        lease_id IN (
            SELECT id FROM leases WHERE owner_id = auth.uid()
        )
    );

-- Politique : Un propriétaire peut mettre à jour ses décisions (dans un délai raisonnable)
CREATE POLICY "Propriétaires peuvent modifier leurs décisions récentes"
    ON lease_decisions
    FOR UPDATE
    USING (
        decided_by = auth.uid()
        AND
        created_at > NOW() - INTERVAL '7 days' -- Modifiable dans les 7 jours
    );

COMMENT ON TABLE lease_decisions IS 'Stocke les décisions manuelles des propriétaires concernant le renouvellement ou la résiliation des baux';
COMMENT ON COLUMN lease_decisions.decision_type IS 'Type de décision: renew (renouveler) ou terminate (donner congé)';
COMMENT ON COLUMN lease_decisions.termination_reason IS 'Motif légal du congé (reprise, vente, motif légitime)';
COMMENT ON COLUMN lease_decisions.notice_type IS 'Type de préavis juridique envoyé (J-180 ou J-90)';
