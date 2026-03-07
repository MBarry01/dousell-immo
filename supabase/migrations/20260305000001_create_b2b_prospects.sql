-- Migration: b2b_prospects
-- B2B lead generation for Dousel Immo SaaS (real estate agencies, promoteurs, gestionnaires locatifs)

CREATE TYPE prospect_status AS ENUM (
  'new', 'enriched', 'verified', 'qualified', 'disqualified',
  'emailed_j0', 'emailed_j3', 'emailed_j7',
  'replied', 'meeting_booked', 'converted', 'unsubscribed'
);

CREATE TABLE b2b_prospects (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  -- Identification
  company_name      text NOT NULL,
  source            text NOT NULL CHECK (source IN ('google_maps', 'expat_dakar', 'apollo', 'manual', 'linkedin')),
  source_id         text,

  -- Contact professionnel uniquement (pas de données personnelles privées)
  email             text,
  email_verified    boolean DEFAULT false,
  email_source      text CHECK (email_source IN ('hunter', 'apollo', 'manual', 'website', NULL)),
  phone             text,
  website           text,
  linkedin_url      text,

  -- Localisation
  city              text DEFAULT 'Dakar',
  address           text,
  google_place_id   text UNIQUE,

  -- Scoring (0-100)
  score             int DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_details     jsonb DEFAULT '{}',
  listings_count    int DEFAULT 0,

  -- Statut séquence email
  status            prospect_status DEFAULT 'new',
  last_emailed_at   timestamptz,
  j0_sent_at        timestamptz,
  j3_sent_at        timestamptz,
  j7_sent_at        timestamptz,
  email_opened      boolean DEFAULT false,
  email_clicked     boolean DEFAULT false,
  unsubscribed_at   timestamptz,

  -- CRM externe (optionnel)
  hubspot_id        text,
  notion_page_id    text,
  notes             text,

  UNIQUE(email, company_name)
);

-- RLS : accès admin uniquement
ALTER TABLE b2b_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only read b2b_prospects" ON b2b_prospects
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only insert b2b_prospects" ON b2b_prospects
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only update b2b_prospects" ON b2b_prospects
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only delete b2b_prospects" ON b2b_prospects
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Note: Soft-delete via status='disqualified'/'unsubscribed' est préféré au hard-delete.
-- Service role bypass pour n8n (utilise SUPABASE_SERVICE_KEY)
-- La service key bypass automatiquement RLS, pas besoin de policy supplémentaire.

-- Index pour les requêtes fréquentes
CREATE INDEX idx_b2b_prospects_status ON b2b_prospects(status);
CREATE INDEX idx_b2b_prospects_score  ON b2b_prospects(score DESC);
CREATE INDEX idx_b2b_prospects_source ON b2b_prospects(source);
CREATE INDEX idx_b2b_prospects_email  ON b2b_prospects(email) WHERE email IS NOT NULL;

-- Auto-update updated_at (réutilise la fonction existante du projet)
CREATE TRIGGER update_b2b_prospects_updated_at
  BEFORE UPDATE ON b2b_prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
