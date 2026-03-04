-- supabase/migrations/20260304000001_add_article_id_to_leads.sql
-- Ajoute l'attribution article aux leads et inscriptions

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_article_id_idx ON leads (article_id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_signup_article_id_idx ON profiles (signup_article_id);

COMMENT ON COLUMN leads.article_id IS 'Article source du lead (attribution blog)';
COMMENT ON COLUMN profiles.signup_article_id IS 'Article lu avant inscription (attribution blog)';
