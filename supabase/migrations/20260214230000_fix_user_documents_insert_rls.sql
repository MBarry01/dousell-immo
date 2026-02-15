-- Fix RLS INSERT policy on user_documents to allow 'generated' source
-- Previously only 'manual' was allowed, blocking auto-generated documents (quotes, receipts)

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can upload their documents" ON public.user_documents;
DROP POLICY IF EXISTS "user_documents_insert_policy" ON public.user_documents;

-- Recreate with broader source check
CREATE POLICY "Users can upload their documents"
  ON public.user_documents
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND source IN ('manual', 'verification', 'generated')
  );
