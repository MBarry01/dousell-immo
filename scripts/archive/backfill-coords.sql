-- Script de rétro-géocodage des annonces existantes
-- Exécuter dans Supabase SQL Editor après avoir appliqué la migration

-- Mettre à jour les annonces à Almadies
UPDATE external_listings 
SET coords_lat = 14.7453 + (random() - 0.5) * 0.004,
    coords_lng = -17.5228 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL 
AND (lower(location) LIKE '%almadies%' OR lower(location) LIKE '%almady%');

-- Ngor
UPDATE external_listings 
SET coords_lat = 14.7500 + (random() - 0.5) * 0.004,
    coords_lng = -17.5167 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%ngor%';

-- Ouakam
UPDATE external_listings 
SET coords_lat = 14.7261 + (random() - 0.5) * 0.004,
    coords_lng = -17.4892 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%ouakam%';

-- Yoff
UPDATE external_listings 
SET coords_lat = 14.7417 + (random() - 0.5) * 0.004,
    coords_lng = -17.4833 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%yoff%';

-- Mamelles
UPDATE external_listings 
SET coords_lat = 14.7333 + (random() - 0.5) * 0.004,
    coords_lng = -17.5000 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%mamelles%';

-- Mermoz
UPDATE external_listings 
SET coords_lat = 14.7167 + (random() - 0.5) * 0.004,
    coords_lng = -17.4667 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%mermoz%';

-- Sacré Coeur
UPDATE external_listings 
SET coords_lat = 14.7100 + (random() - 0.5) * 0.004,
    coords_lng = -17.4600 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND (lower(location) LIKE '%sacre coeur%' OR lower(location) LIKE '%sacré coeur%');

-- Point E
UPDATE external_listings 
SET coords_lat = 14.6950 + (random() - 0.5) * 0.004,
    coords_lng = -17.4650 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%point e%';

-- Fann
UPDATE external_listings 
SET coords_lat = 14.6917 + (random() - 0.5) * 0.004,
    coords_lng = -17.4750 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%fann%';

-- Plateau
UPDATE external_listings 
SET coords_lat = 14.6667 + (random() - 0.5) * 0.004,
    coords_lng = -17.4333 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%plateau%';

-- Médina
UPDATE external_listings 
SET coords_lat = 14.6750 + (random() - 0.5) * 0.004,
    coords_lng = -17.4417 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%medina%';

-- Grand Dakar
UPDATE external_listings 
SET coords_lat = 14.6833 + (random() - 0.5) * 0.004,
    coords_lng = -17.4500 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%grand dakar%';

-- HLM
UPDATE external_listings 
SET coords_lat = 14.7000 + (random() - 0.5) * 0.004,
    coords_lng = -17.4417 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%hlm%';

-- Parcelles Assainies
UPDATE external_listings 
SET coords_lat = 14.7667 + (random() - 0.5) * 0.004,
    coords_lng = -17.4167 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%parcelles%';

-- Grand Yoff
UPDATE external_listings 
SET coords_lat = 14.7333 + (random() - 0.5) * 0.004,
    coords_lng = -17.4500 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%grand yoff%';

-- Liberté
UPDATE external_listings 
SET coords_lat = 14.6917 + (random() - 0.5) * 0.004,
    coords_lng = -17.4583 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND (lower(location) LIKE '%liberté%' OR lower(location) LIKE '%liberte%');

-- SICAP
UPDATE external_listings 
SET coords_lat = 14.7000 + (random() - 0.5) * 0.004,
    coords_lng = -17.4583 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%sicap%';

-- Keur Gorgui
UPDATE external_listings 
SET coords_lat = 14.7150 + (random() - 0.5) * 0.004,
    coords_lng = -17.4700 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%keur gorgui%';

-- Maristes / Hann Maristes
UPDATE external_listings 
SET coords_lat = 14.7200 + (random() - 0.5) * 0.004,
    coords_lng = -17.4200 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%maristes%';

-- Pikine
UPDATE external_listings 
SET coords_lat = 14.7500 + (random() - 0.5) * 0.004,
    coords_lng = -17.3833 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%pikine%';

-- Guédiawaye
UPDATE external_listings 
SET coords_lat = 14.7667 + (random() - 0.5) * 0.004,
    coords_lng = -17.3833 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND (lower(location) LIKE '%guediawaye%' OR lower(location) LIKE '%guédiawaye%');

-- Keur Massar
UPDATE external_listings 
SET coords_lat = 14.7833 + (random() - 0.5) * 0.004,
    coords_lng = -17.3167 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%keur massar%';

-- Rufisque
UPDATE external_listings 
SET coords_lat = 14.7167 + (random() - 0.5) * 0.004,
    coords_lng = -17.2667 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%rufisque%';

-- Diamniadio
UPDATE external_listings 
SET coords_lat = 14.7000 + (random() - 0.5) * 0.004,
    coords_lng = -17.1833 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%diamniadio%';

-- Saly
UPDATE external_listings 
SET coords_lat = 14.4500 + (random() - 0.5) * 0.004,
    coords_lng = -17.0167 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%saly%';

-- Mbour
UPDATE external_listings 
SET coords_lat = 14.4167 + (random() - 0.5) * 0.004,
    coords_lng = -16.9667 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%mbour%';

-- Somone
UPDATE external_listings 
SET coords_lat = 14.4833 + (random() - 0.5) * 0.004,
    coords_lng = -17.0667 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND lower(location) LIKE '%somone%';

-- Thiès
UPDATE external_listings 
SET coords_lat = 14.7833 + (random() - 0.5) * 0.004,
    coords_lng = -16.9333 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND (lower(location) LIKE '%thiès%' OR lower(location) LIKE '%thies%');

-- Saint-Louis
UPDATE external_listings 
SET coords_lat = 16.0333 + (random() - 0.5) * 0.004,
    coords_lng = -16.5000 + (random() - 0.5) * 0.004
WHERE coords_lat IS NULL AND (lower(location) LIKE '%saint-louis%' OR lower(location) LIKE '%saint louis%');

-- Fallback: Assigner les annonces restantes à leur ville
UPDATE external_listings 
SET coords_lat = 14.6928 + (random() - 0.5) * 0.01,
    coords_lng = -17.4467 + (random() - 0.5) * 0.01
WHERE coords_lat IS NULL AND city = 'Dakar';

UPDATE external_listings 
SET coords_lat = 14.4500 + (random() - 0.5) * 0.01,
    coords_lng = -17.0167 + (random() - 0.5) * 0.01
WHERE coords_lat IS NULL AND city = 'Saly';

UPDATE external_listings 
SET coords_lat = 14.7833 + (random() - 0.5) * 0.01,
    coords_lng = -16.9333 + (random() - 0.5) * 0.01
WHERE coords_lat IS NULL AND city = 'Thiès';

UPDATE external_listings 
SET coords_lat = 16.0333 + (random() - 0.5) * 0.01,
    coords_lng = -16.5000 + (random() - 0.5) * 0.01
WHERE coords_lat IS NULL AND city = 'Saint-Louis';

-- Afficher le résultat
SELECT 
    COUNT(*) as total,
    COUNT(coords_lat) as with_coords,
    COUNT(*) - COUNT(coords_lat) as without_coords
FROM external_listings;
