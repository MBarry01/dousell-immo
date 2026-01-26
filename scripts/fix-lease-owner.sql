-- Fix existing lease for Appart F2 to appear on user's dashboard
-- This updates the owner_id of the lease to match the team owner

-- Option 1: If you know your user ID, replace 'YOUR_USER_ID' with it
-- UPDATE leases 
-- SET owner_id = 'YOUR_USER_ID'
-- WHERE tenant_name = 'Samantha Mbaye';

-- Option 2: Automatically update all leases to use team owner as owner_id
UPDATE leases l
SET owner_id = tm.user_id
FROM team_members tm
WHERE tm.team_id = l.team_id
AND tm.role = 'owner'
AND l.owner_id != tm.user_id;

-- Verify the update
SELECT 
    l.id,
    l.tenant_name,
    l.owner_id,
    l.team_id,
    tm.user_id as team_owner_id
FROM leases l
LEFT JOIN team_members tm ON tm.team_id = l.team_id AND tm.role = 'owner'
WHERE l.status = 'active';
