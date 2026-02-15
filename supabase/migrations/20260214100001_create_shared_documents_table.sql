-- Shared documents: owner can share docs with tenants (règlement intérieur, diagnostics, etc.)
CREATE TABLE IF NOT EXISTS public.shared_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT DEFAULT 'other' CHECK (category IN ('reglement', 'diagnostic', 'etat_des_lieux', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_documents_lease_id ON public.shared_documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_team_id ON public.shared_documents(team_id);

-- Enable RLS
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can manage shared documents for their leases
CREATE POLICY "Owners can manage shared documents"
ON public.shared_documents
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Note: Tenant access is via service role (bypass RLS) since tenants don't have auth.users accounts
COMMENT ON TABLE public.shared_documents IS 'Documents shared by owners with tenants (reglement, diagnostics, etc.)';
