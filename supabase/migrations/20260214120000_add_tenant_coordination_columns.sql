-- Migration: Add tenant coordination columns to maintenance_requests
-- Date: 2026-02-14

ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS tenant_response TEXT CHECK (tenant_response IN ('confirmed', 'reschedule_requested')),
ADD COLUMN IF NOT EXISTS tenant_suggested_date TIMESTAMPTZ;
