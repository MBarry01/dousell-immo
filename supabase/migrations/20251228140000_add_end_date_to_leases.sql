-- Migration: Ajouter end_date à la table leases
-- Pour supporter les alertes de fin de bail (J-180 et J-90)
-- Conforme au cadre juridique sénégalais (tacite reconduction)

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Commentaire explicatif
COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';

-- Index pour optimiser les requêtes du cron job
CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
