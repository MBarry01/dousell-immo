-- Migration: Add certification_scope to user_documents
-- Description: Differentiate between global (identity) and specific (property) document certification
-- Created: 2025-12-25

-- Add certification_scope column with CHECK constraint
ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS certification_scope TEXT 
DEFAULT 'specific' 
CHECK (certification_scope IN ('global', 'specific'));

-- Update existing documents based on file_type
-- Identity documents (CNI, Passport) = global scope (certifies the entire profile)
UPDATE user_documents 
SET certification_scope = 'global' 
WHERE file_type IN ('cni', 'passport');

-- Property documents (others) = specific scope (certifies only the specific ad)
UPDATE user_documents 
SET certification_scope = 'specific' 
WHERE file_type NOT IN ('cni', 'passport');

-- Add is_certified column if it doesn't exist
ALTER TABLE user_documents 
ADD COLUMN IF NOT EXISTS is_certified BOOLEAN 
DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_documents_certification_scope 
ON user_documents(certification_scope);

CREATE INDEX IF NOT EXISTS idx_user_documents_is_certified 
ON user_documents(is_certified);
