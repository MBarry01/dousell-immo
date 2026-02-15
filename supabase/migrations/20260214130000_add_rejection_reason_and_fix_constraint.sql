-- Migration: Add rejection reason and reinforce status constraint
-- Date: 2026-02-14

-- 1. Add rejection_reason column
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Reinforce/Update status constraint
ALTER TABLE maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_status_valid;

ALTER TABLE maintenance_requests
ADD CONSTRAINT maintenance_status_valid 
CHECK (status IN (
    'submitted', 
    'open', 
    'artisan_found', 
    'awaiting_approval', 
    'approved', 
    'in_progress', 
    'completed', 
    'rejected', 
    'cancelled',
    'quote_received'
));
