-- Update file_type check to allow 'maintenance' for quote/invoice documents
ALTER TABLE public.user_documents DROP CONSTRAINT IF EXISTS user_documents_file_type_check;

ALTER TABLE public.user_documents ADD CONSTRAINT user_documents_file_type_check 
  CHECK (file_type IN ('titre_propriete', 'bail', 'cni', 'facture', 'attestation', 'autre', 'quittance', 'etat_lieux', 'facture_travaux', 'maintenance'));
