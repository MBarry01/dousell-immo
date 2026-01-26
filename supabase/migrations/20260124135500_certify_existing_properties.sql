-- Certify all existing properties that belong to a team (workspace)
UPDATE properties
SET verification_status = 'verified'
WHERE team_id IS NOT NULL;
