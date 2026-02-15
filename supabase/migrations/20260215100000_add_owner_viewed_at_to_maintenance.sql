-- Add owner_viewed_at to track when owner has seen a maintenance request
ALTER TABLE maintenance_requests
ADD COLUMN IF NOT EXISTS owner_viewed_at TIMESTAMPTZ DEFAULT NULL;
