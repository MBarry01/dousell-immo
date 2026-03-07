-- Migration: SEO 4-Tier RPC for sitemap generation
-- Purpose: Generate city/district/type combinations for SEO pages
-- Scope: Returns active property combinations with counts for dynamic page generation
-- Created: 2026-03-07

-- Create function: get_active_cities_districts_types()
-- Returns: table with city_slug, district_slug, property_type, property_count
-- Used by: lib/seo/generateStaticParams.ts for sitemap and dynamic route generation
CREATE OR REPLACE FUNCTION get_active_cities_districts_types(
  min_count INT DEFAULT 1,
  target_category TEXT DEFAULT 'vente'
)
RETURNS TABLE (
  city_slug TEXT,
  district_slug TEXT,
  property_type TEXT,
  property_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Extract city slug (lowercase for consistency)
    LOWER(p.location->>'city')::TEXT AS city_slug,
    -- Extract district slug or 'all' if null/empty
    -- When location->>'landmark' is NULL or empty, use 'all'
    COALESCE(NULLIF(LOWER(p.location->>'landmark'), ''), 'all')::TEXT AS district_slug,
    -- Extract property type (lowercase for consistency)
    LOWER(p.details->>'type')::TEXT AS property_type,
    -- Count of properties in this combination
    COUNT(*) AS property_count
  FROM properties p
  WHERE
    -- Filter: only available properties
    p.status = 'disponible'
    -- Filter: only approved properties (validation passed)
    AND p.validation_status = 'approved'
    -- Filter: city must be present
    AND p.location->>'city' IS NOT NULL
    -- Filter: property type must be present
    AND p.details->>'type' IS NOT NULL
    -- Filter: by category (vente, location, or other)
    AND (
      target_category IS NULL
      OR p.category = target_category
    )
  GROUP BY
    LOWER(p.location->>'city'),
    COALESCE(NULLIF(LOWER(p.location->>'landmark'), ''), 'all'),
    LOWER(p.details->>'type')
  -- Filter: only return combinations with minimum count
  HAVING COUNT(*) >= min_count
  -- Order: predictable output for pagination/caching
  ORDER BY
    LOWER(p.location->>'city') ASC,
    COALESCE(NULLIF(LOWER(p.location->>'landmark'), ''), 'all') ASC,
    LOWER(p.details->>'type') ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to public and authenticated users
-- Used by vitrine (public) and workspace (authenticated)
GRANT EXECUTE ON FUNCTION get_active_cities_districts_types(INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_active_cities_districts_types(INT, TEXT) TO authenticated;

-- Index optimization notes:
-- - properties table already has indices on location->>'city' and location->>'district'
-- - JSONB operator ->> (text extraction) is fast with proper indices
-- - Consider adding index on location->>'landmark' if slow:
--   CREATE INDEX idx_properties_landmark ON properties USING btree ((location->>'landmark'));
-- - Consider index on details->>'type' if slow:
--   CREATE INDEX idx_properties_type ON properties USING btree ((details->>'type'));
