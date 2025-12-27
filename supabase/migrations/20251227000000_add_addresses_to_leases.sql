-- Migration: Ajout de l'adresse du bien loué
-- Date: 2025-12-27
-- Description: Ajoute la colonne property_address à la table leases
-- Note: L'adresse du bien loué sert également d'adresse du locataire dans les quittances

-- Ajouter la colonne pour l'adresse du bien loué
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS property_address TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN leases.property_address IS 'Adresse du bien loué (immeuble/appartement) - Sert également d''adresse du locataire';
