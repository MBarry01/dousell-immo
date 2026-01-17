-- Création de la table pour les annonces scrapées
CREATE TABLE IF NOT EXISTS external_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_url TEXT UNIQUE NOT NULL, -- Index unique pour l'Upsert
    title TEXT NOT NULL,
    price TEXT,
    location TEXT,
    image_url TEXT,
    source_site TEXT DEFAULT 'CoinAfrique',
    
    -- Métadonnées de classification
    category TEXT DEFAULT 'Autre', -- Appartement, Villa, Terrain
    type TEXT DEFAULT 'Vente',     -- Vente, Location
    city TEXT DEFAULT 'Dakar',     -- Dakar, Saly, Thiès...
    
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches de la vitrine
CREATE INDEX IF NOT EXISTS idx_external_city ON external_listings(city);
CREATE INDEX IF NOT EXISTS idx_external_category ON external_listings(category);
CREATE INDEX IF NOT EXISTS idx_external_type ON external_listings(type);
