-- Backfill team_id and owner_id on rental_transactions that are missing them.
-- This fixes Stripe payments saved by the success page fallback without team_id,
-- which makes them invisible to the /gestion dashboard (queries filter by team_id).

UPDATE rental_transactions rt
SET
    team_id = l.team_id,
    owner_id = l.owner_id
FROM leases l
WHERE rt.lease_id = l.id
  AND rt.team_id IS NULL
  AND l.team_id IS NOT NULL;
