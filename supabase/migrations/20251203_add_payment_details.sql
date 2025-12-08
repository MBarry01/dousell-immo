-- Ajouter les colonnes payment_amount et service_name à la table properties
-- pour stocker les détails du paiement PayDunya

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN properties.payment_amount IS 'Montant payé via PayDunya (en FCFA)';
COMMENT ON COLUMN properties.service_name IS 'Nom du service payé (ex: Diffusion Simple - Studio, Boost Visibilité - Appartement)';
