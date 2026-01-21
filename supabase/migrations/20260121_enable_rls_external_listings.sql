-- Enable RLS on external_listings table
ALTER TABLE external_listings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all rows
CREATE POLICY "Allow public read access"
ON external_listings
FOR SELECT
TO public
USING (true);
