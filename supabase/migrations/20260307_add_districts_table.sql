-- Migration: Districts table for SEO pages (quartier-level pages)
-- Purpose: Store Senegalese districts for dynamic SEO page generation
-- Scope: Dakar, Thiès, and future expansion cities
-- Created: 2026-03-07

-- Create cities table if not exists (required FK reference)
-- Note: This assumes cities table exists. If not, this migration will fail.

CREATE TABLE IF NOT EXISTS districts (
  -- Identification
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,

  -- Names (FR required, EN optional for bilingual SEO)
  name_fr text NOT NULL,
  name_en text,

  -- Geographic data
  city_slug text NOT NULL, -- FK to cities table
  lat numeric(10, 6) NOT NULL, -- Latitude
  lng numeric(10, 6) NOT NULL, -- Longitude

  -- SEO & context
  description text,
  landmarks text[], -- Array of landmark names
  price_range_min bigint, -- Minimum price in XOF (centimes)
  price_range_max bigint, -- Maximum price in XOF (centimes)

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT valid_latitude CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT valid_longitude CHECK (lng >= -180 AND lng <= 180),
  CONSTRAINT valid_price_range CHECK (
    price_range_min IS NULL OR price_range_max IS NULL OR
    price_range_min <= price_range_max
  )
);

-- Foreign key: city_slug -> cities.slug
-- Note: Assumes cities table has (slug TEXT PRIMARY KEY)
ALTER TABLE districts
  ADD CONSTRAINT fk_districts_city_slug
    FOREIGN KEY (city_slug)
    REFERENCES cities(slug)
    ON DELETE CASCADE;

-- Indexes for fast lookups
CREATE INDEX idx_districts_city_slug ON districts(city_slug);
CREATE INDEX idx_districts_slug ON districts(slug);
CREATE INDEX idx_districts_created_at ON districts(created_at DESC);

-- RLS: Public read access (SEO pages)
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read districts" ON districts
  FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admin write districts" ON districts
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin update districts" ON districts
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin delete districts" ON districts
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Auto-update updated_at on changes
CREATE TRIGGER update_districts_updated_at
  BEFORE UPDATE ON districts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial data: Dakar (10 districts) + Thiès (center)
INSERT INTO districts (id, slug, name_fr, name_en, city_slug, lat, lng, description, landmarks, price_range_min, price_range_max)
VALUES
  -- Dakar
  ('11111111-1111-1111-1111-111111111101', 'plateau', 'Plateau', 'Plateau', 'dakar', 14.6756, -17.4412, 'Cœur commercial et administratif de Dakar. Bâtiments coloniaux, boulangeries historiques, proximité de la Presidency.', ARRAY['Presidency Senegal', 'Cathédrale de Dakar', 'Soumbédioune'], 75000000, 250000000),
  ('11111111-1111-1111-1111-111111111102', 'almadies', 'Almadies', 'Almadies', 'dakar', 14.7358, -17.5038, 'Quartier côtier prestigieux avec vue sur l''océan Atlantique. Résidences de standing, villas contemporaines.', ARRAY['Phare des Almadies', 'Plage de Ngor', 'Corniche ouest'], 150000000, 400000000),
  ('11111111-1111-1111-1111-111111111103', 'ouakam', 'Ouakam', 'Ouakam', 'dakar', 14.7477, -17.5148, 'Quartier côtier dynamique avec plages publiques, restaurants, vie nocturne. Très accessible aux touristes.', ARRAY['Plage de Ouakam', 'Club de plage', 'Marina'], 80000000, 300000000),
  ('11111111-1111-1111-1111-111111111104', 'yoff', 'Yoff', 'Yoff', 'dakar', 14.7498, -17.4845, 'Quartier résidentiel nord, près de l''aéroport Blaise Diagne. Mélange de habitat moderne et traditionnel.', ARRAY['Aéroport Blaise Diagne', 'Lac Rose'], 45000000, 200000000),
  ('11111111-1111-1111-1111-111111111105', 'ngor', 'Ngor', 'Ngor', 'dakar', 14.765, -17.5248, 'Quartier côtier bohème avec îlot de Ngor. Plages, surf, ambiance créative et communautés étrangères.', ARRAY['Île de Ngor', 'Plage de Ngor', 'Surf spots'], 60000000, 280000000),
  ('11111111-1111-1111-1111-111111111106', 'mermoz', 'Mermoz', 'Mermoz', 'dakar', 14.7116, -17.4945, 'Quartier résidentiel prestigieux, calme et arborisé. Villas individuelles, familles aisées, expatriés.', ARRAY['Rond-point Mermoz', 'VDN Extension', 'Golf de Dakar'], 120000000, 350000000),
  ('11111111-1111-1111-1111-111111111107', 'fann-point-e', 'Fann / Point-E', 'Fann / Point-E', 'dakar', 14.6937, -17.4723, 'Quartier mixte central avec commerces, immeubles résidentiels, université. Vie urbaine animée.', ARRAY['Université Cheikh Anta Diop', 'Ministère de l''Éducation', 'Hôpital Fann'], 70000000, 220000000),
  ('11111111-1111-1111-1111-111111111108', 'hann-bel-air', 'Hann / Bel-Air', 'Hann / Bel-Air', 'dakar', 14.688, -17.4595, 'Quartier populaire et dynamique. Densité commerciale, marchés locaux, accès facile aux transports.', ARRAY['Marché Hann', 'Bel-Air Station', 'Gare routière'], 35000000, 140000000),
  ('11111111-1111-1111-1111-111111111109', 'liberté', 'Liberté', 'Liberte', 'dakar', 14.7042, -17.4528, 'Quartier résidentiel avec immeubles de standing, commerces haut de gamme. Classe moyenne supérieure.', ARRAY['Rond-point de la Liberté', 'Marché de la Liberté', 'Stade Demba Diop'], 85000000, 280000000),
  ('11111111-1111-1111-1111-111111111110', 'patte-doie', 'Patte-d''Oie', 'Patte d''Oie', 'dakar', 14.7246, -17.4412, 'Quartier résidentiel à croissance rapide. Immeubles modernes, petits commerces, bonne accessibilité.', ARRAY['Rond-point Patte-d''Oie', 'École africaine'], 55000000, 200000000),
  -- Thiès
  ('11111111-1111-1111-1111-111111111111', 'centre-ville', 'Centre-Ville', 'City Center', 'thies', 14.7919, -16.935, 'Centre administratif et commercial de Thiès. Accès aux services, marchés, transports inter-régionaux.', ARRAY['Gare routière', 'Marché Central', 'Préfecture'], 20000000, 100000000)
ON CONFLICT (slug) DO NOTHING;

-- Note: ON CONFLICT DO NOTHING prevents re-insertion on re-runs (idempotent)
