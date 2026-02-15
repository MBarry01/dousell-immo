-- Migration: Update maintenance status check constraint
-- Date: 2026-02-14

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
    'quote_received' -- Keep for legacy if any exist
));
