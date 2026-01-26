-- Fix properties with active leases to have correct status
-- This updates all properties that have an active lease but still show as "disponible"

UPDATE properties p
SET 
    status = 'loué',
    validation_status = 'pending'
FROM leases l
WHERE l.property_id = p.id
AND l.status = 'active'
AND (p.status = 'disponible' OR p.validation_status = 'approved');

-- Verify the update
SELECT 
    p.id,
    p.title,
    p.status,
    p.validation_status,
    l.tenant_name,
    l.status as lease_status
FROM properties p
JOIN leases l ON l.property_id = p.id
WHERE l.status = 'active';
