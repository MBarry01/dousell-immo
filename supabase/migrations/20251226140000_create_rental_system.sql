-- Migration: Create Rental Management System Tables
-- Date: 2025-12-26
-- Description: Phase 1 - Foundational tables for "Gestion Locative" Premium Module

-- 1. Table des contrats de location (Leases)
CREATE TABLE IF NOT EXISTS leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenant_name TEXT NOT NULL,
    tenant_email TEXT,
    tenant_phone TEXT,
    monthly_amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'FCFA',
    start_date DATE NOT NULL,
    end_date DATE,
    billing_day INTEGER DEFAULT 5, -- Jour du mois pour l'avis d'échéance
    status TEXT DEFAULT 'active', -- active, terminated, pending_signature
    lease_pdf_url TEXT, -- URL du contrat généré
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des transactions et documents financiers (Invoices/Quittances)
CREATE TABLE IF NOT EXISTS rental_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    amount_due DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue
    notice_url TEXT, -- Lien vers l'avis d'échéance PDF
    receipt_url TEXT, -- Lien vers la quittance de loyer PDF
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des demandes de maintenance et devis
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT, -- plomberie, électricité, maçonnerie
    status TEXT DEFAULT 'open', -- open, quote_received, approved, completed
    photo_urls TEXT[], -- Array de photos du problème
    quote_amount DECIMAL,
    quote_url TEXT, -- Lien vers le devis PDF de l'artisan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leases
CREATE POLICY "Users can view their own leases"
    ON leases FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own leases"
    ON leases FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own leases"
    ON leases FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own leases"
    ON leases FOR DELETE
    USING (auth.uid() = owner_id);

-- RLS Policies for rental_transactions
CREATE POLICY "Users can view transactions for their leases"
    ON rental_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = rental_transactions.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transactions for their leases"
    ON rental_transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = rental_transactions.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transactions for their leases"
    ON rental_transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = rental_transactions.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

-- RLS Policies for maintenance_requests
CREATE POLICY "Users can view maintenance requests for their leases"
    ON maintenance_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = maintenance_requests.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create maintenance requests for their leases"
    ON maintenance_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = maintenance_requests.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update maintenance requests for their leases"
    ON maintenance_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = maintenance_requests.lease_id
            AND leases.owner_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_leases_owner_id ON leases(owner_id);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_rental_transactions_lease_id ON rental_transactions(lease_id);
CREATE INDEX idx_rental_transactions_status ON rental_transactions(status);
CREATE INDEX idx_maintenance_requests_lease_id ON maintenance_requests(lease_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
