-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to services"
  ON services
  FOR SELECT
  TO public
  USING (true);

-- Insert initial data
INSERT INTO services (code, name, price, description, features)
VALUES
  (
    'mandat_confort',
    'Mandat Agence',
    0,
    'L''option sérénité. Doussel Immo s''occupe de tout.',
    '["Photos professionnelles", "Gestion des visites", "Rédaction du bail/vente", "Commission au succès"]'::jsonb
  ),
  (
    'boost_visibilite',
    'Diffusion Simple',
    1500,
    'L''option autonomie. Vous payez pour afficher votre annonce.',
    '["Annonce visible 30 jours", "Gestion autonome des visites", "Paiement unique"]'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  price = EXCLUDED.price,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features;

-- Grant permissions
GRANT SELECT ON services TO anon, authenticated, service_role;
