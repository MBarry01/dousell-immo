-- supabase/migrations/20260303000001_create_articles.sql

CREATE TABLE articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text UNIQUE NOT NULL,
  excerpt             text,
  cover_image         text,
  blocks              jsonb NOT NULL DEFAULT '[]',
  content_markdown    text,
  template            text NOT NULL DEFAULT 'standard'
                        CHECK (template IN ('standard', 'grand-reportage', 'guide-pratique')),
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  author_name         text NOT NULL DEFAULT 'Équipe Doussel',
  author_avatar       text,
  meta_title          text,
  meta_description    text,
  category            text
                        CHECK (category IN ('Guides','Investissement','Juridique','Conseils','Marché','Innovation')),
  published_at        timestamptz,
  read_time_minutes   int,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX articles_slug_idx ON articles (slug);
CREATE INDEX articles_status_idx ON articles (status);
CREATE INDEX articles_category_idx ON articles (category);
CREATE INDEX articles_published_at_idx ON articles (published_at DESC NULLS LAST);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_articles_updated_at();

-- RLS (admin only via service role — no direct user access)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: public can read published articles
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');
