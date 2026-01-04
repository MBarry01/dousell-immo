-- Migration: Create inventory_reports table for États des Lieux
-- Description: Stores entry/exit inventory reports with room-by-room checklist

CREATE TABLE IF NOT EXISTS inventory_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
    
    -- Metadata
    report_date DATE DEFAULT CURRENT_DATE,
    meter_readings JSONB DEFAULT '{}'::jsonb,
    -- Format: { "electricity": 12345, "water": 6789, "gas": 0 }
    
    -- Rooms data stored as JSONB array
    rooms JSONB DEFAULT '[]'::jsonb,
    -- Format: [{ "name": "Entrée", "items": [{ "name": "Porte", "condition": "bon", "comment": "", "photos": [] }] }]
    
    -- General observations
    general_comments TEXT,
    
    -- Signatures (base64 or URL)
    owner_signature TEXT,
    tenant_signature TEXT,
    signed_at TIMESTAMPTZ,
    
    -- PDF export
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_reports_lease ON inventory_reports(lease_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_owner ON inventory_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_type ON inventory_reports(type);

-- Enable RLS
ALTER TABLE inventory_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their inventory reports"
    ON inventory_reports FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can create inventory reports"
    ON inventory_reports FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their inventory reports"
    ON inventory_reports FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their inventory reports"
    ON inventory_reports FOR DELETE
    USING (owner_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_reports_updated_at
    BEFORE UPDATE ON inventory_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_reports_updated_at();

-- Comment
COMMENT ON TABLE inventory_reports IS 'États des lieux (Entry/Exit inventory reports) for lease management';
