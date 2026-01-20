-- Migration: Ajout des coordonnées GPS aux annonces externes
-- Date: 2026-01-20
-- Description: Ajoute les colonnes coords pour le géocodage dynamique

-- ============================================
-- Ajouter les colonnes de coordonnées
-- ============================================
ALTER TABLE external_listings
ADD COLUMN IF NOT EXISTS coords_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS coords_lng DOUBLE PRECISION;

-- Index pour les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_external_coords ON external_listings(coords_lat, coords_lng)
WHERE coords_lat IS NOT NULL AND coords_lng IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN external_listings.coords_lat IS 'Latitude GPS (géocodé via Nominatim/OpenStreetMap)';
COMMENT ON COLUMN external_listings.coords_lng IS 'Longitude GPS (géocodé via Nominatim/OpenStreetMap)';

-- Note: Les nouvelles annonces sont géocodées automatiquement par le webhook
-- Pour les annonces existantes, relancer un scraping Apify ou appeler l'API de backfill
