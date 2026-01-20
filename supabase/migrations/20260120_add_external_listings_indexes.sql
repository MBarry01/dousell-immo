-- Migration: Ajout des index pour le système multi-sources
-- Date: 2026-01-20
-- Description: Index nécessaires pour le nettoyage ciblé par source et TTL

-- Index sur source_site pour le nettoyage ciblé (DELETE WHERE source_site = X)
CREATE INDEX IF NOT EXISTS idx_external_source_site ON external_listings(source_site);

-- Index sur last_seen_at pour le nettoyage TTL (DELETE WHERE last_seen_at < X)
CREATE INDEX IF NOT EXISTS idx_external_last_seen ON external_listings(last_seen_at);

-- Index composite pour le nettoyage optimisé (source_site + last_seen_at)
-- Utilisé par: DELETE FROM external_listings WHERE source_site = X AND last_seen_at < Y
CREATE INDEX IF NOT EXISTS idx_external_cleanup ON external_listings(source_site, last_seen_at);

-- Index composite pour les requêtes de la vitrine (filtres combinés)
-- Utilisé par: SELECT * WHERE type = X AND city = Y ORDER BY last_seen_at DESC
CREATE INDEX IF NOT EXISTS idx_external_search ON external_listings(type, city, last_seen_at DESC);
