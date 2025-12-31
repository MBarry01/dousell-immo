-- Migration: Gestion Locative Activation System
-- Date: 2025-12-31
-- Description: Add fields for gestion locative activation with document verification

-- 1. Add gestion_locative fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gestion_locative_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gestion_locative_status TEXT DEFAULT 'inactive'; -- inactive, pending, approved, rejected

-- 2. Create activation requests table
CREATE TABLE IF NOT EXISTS gestion_locative_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    
    -- Justificatifs demandés
    identity_document_url TEXT, -- Pièce d'identité
    property_proof_url TEXT, -- Justificatif de propriété (titre foncier, acte de vente, etc.)
    
    -- Feedback admin
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE gestion_locative_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own requests"
    ON gestion_locative_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
    ON gestion_locative_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
    ON gestion_locative_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- Note: Admin updates will be done via service role

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_gestion_requests_user ON gestion_locative_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gestion_requests_status ON gestion_locative_requests(status);

-- 6. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('gestion-locative-docs', 'gestion-locative-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for the bucket
CREATE POLICY "Users can upload their own documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'gestion-locative-docs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gestion-locative-docs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can view all documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gestion-locative-docs'
        AND EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'moderator')
        )
    );
