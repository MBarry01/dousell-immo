-- Migration: Workflow Interventions V2
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter colonnes à maintenance_requests
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS artisan_name TEXT,
ADD COLUMN IF NOT EXISTS artisan_phone TEXT,
ADD COLUMN IF NOT EXISTS artisan_rating NUMERIC(2,1),
ADD COLUMN IF NOT EXISTS artisan_address TEXT,
ADD COLUMN IF NOT EXISTS quoted_price INTEGER,
ADD COLUMN IF NOT EXISTS intervention_date DATE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_approved BOOLEAN DEFAULT FALSE;

-- 2. Mettre à jour les statuts possibles (commentaire pour référence)
-- Statuts: open, artisan_found, quote_pending, awaiting_approval, approved, in_progress, completed

-- 3. Créer la table expenses pour la comptabilité
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE SET NULL,
    
    -- Détails de la dépense
    description TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Montant en FCFA
    category TEXT DEFAULT 'maintenance', -- maintenance, taxes, travaux, etc.
    
    -- Dates
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optionnel: justificatif
    receipt_url TEXT
);

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);

-- 5. RLS pour expenses (sécurité)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (owner_id = auth.uid());
