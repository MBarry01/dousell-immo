-- Add missing columns to user_documents if they don't exist
ALTER TABLE public.user_documents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id),
ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES public.leases(id),
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update constraints to allow wider usage
-- 1. Update source check to allow 'generated'
ALTER TABLE public.user_documents DROP CONSTRAINT IF EXISTS user_documents_source_check;
ALTER TABLE public.user_documents ADD CONSTRAINT user_documents_source_check 
  CHECK (source IN ('manual', 'verification', 'generated'));

-- 2. Update file_type check to allow rental documents
ALTER TABLE public.user_documents DROP CONSTRAINT IF EXISTS user_documents_file_type_check;
ALTER TABLE public.user_documents ADD CONSTRAINT user_documents_file_type_check 
  CHECK (file_type IN ('titre_propriete', 'bail', 'cni', 'facture', 'attestation', 'autre', 'quittance', 'etat_lieux', 'facture_travaux'));

-- 3. Add checking for entity_type
-- ALTER TABLE public.user_documents ADD CONSTRAINT user_documents_entity_type_check CHECK (entity_type IN ('lease', 'property', 'tenant', 'intervention'));

