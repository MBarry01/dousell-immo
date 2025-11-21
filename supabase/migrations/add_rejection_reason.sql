-- Migration: Ajouter la colonne rejection_reason à la table properties
-- Phase 10: Cycle de vie de l'annonce et Feedback Admin

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN properties.rejection_reason IS 'Motif de refus de l''annonce par l''admin (si validation_status = rejected)';

