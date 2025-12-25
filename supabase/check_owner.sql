-- Query to check property and owner data
SELECT 
  p.id,
  p.title,
  p.owner_id,
  p.service_type,
  p.contact_phone,
  prof.full_name as owner_name,
  prof.phone as owner_phone,
  prof.is_identity_verified
FROM properties p
LEFT JOIN profiles prof ON p.owner_id = prof.id
WHERE p.id = '5d80f21a-d64c-4cbf-bc57-aa11e42fba68';
