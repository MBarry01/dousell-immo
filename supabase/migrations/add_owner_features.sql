-- Migration: Ajout des fonctionnalités Propriétaire
-- Date: 2024

-- Ajouter les nouvelles colonnes à la table properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_agency_listing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'approved' CHECK (validation_status IN ('pending', 'payment_pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('mandat_confort', 'boost_visibilite')),
ADD COLUMN IF NOT EXISTS payment_ref TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_validation_status ON properties(validation_status);
CREATE INDEX IF NOT EXISTS idx_properties_is_agency_listing ON properties(is_agency_listing);

-- Commentaires pour documentation
COMMENT ON COLUMN properties.owner_id IS 'ID du propriétaire (particulier) qui a déposé l''annonce';
COMMENT ON COLUMN properties.is_agency_listing IS 'true si c''est une annonce de l''agence, false si c''est un particulier';
COMMENT ON COLUMN properties.validation_status IS 'Statut de validation: pending, payment_pending, approved, rejected';
COMMENT ON COLUMN properties.service_type IS 'Type de service: mandat_confort (gratuit) ou boost_visibilite (payant)';
COMMENT ON COLUMN properties.payment_ref IS 'Référence de transaction Wave/OM pour le paiement';
COMMENT ON COLUMN properties.views_count IS 'Nombre de vues de l''annonce';

