-- Add custom_data JSONB column to leases table for storing extra import fields
ALTER TABLE leases ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN leases.custom_data IS 'Stores custom fields from CSV imports (e.g., Notes, CNI, Garant)';
