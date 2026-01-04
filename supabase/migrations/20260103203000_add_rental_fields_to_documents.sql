-- Add rental context fields to user_documents
ALTER TABLE user_documents
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_documents_property_id ON user_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_lease_id ON user_documents(lease_id);

-- Update RLS policies to allow access based on property ownership
-- Pass: The existing "Users can view own documents" policy (auth.uid() = user_id) covers this
-- because the user is still the owner of the document linked to their property.
