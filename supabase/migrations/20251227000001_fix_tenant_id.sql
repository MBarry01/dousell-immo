-- Migration corrective: Supprimer la contrainte FK incorrecte et ajuster tenant_id
-- Date: 2025-12-27
-- Description: tenant_id ne doit PAS faire référence à profiles car les locataires ne sont pas des utilisateurs

-- 1. Supprimer la contrainte de clé étrangère incorrecte
ALTER TABLE rental_transactions
DROP CONSTRAINT IF EXISTS fk_rental_transactions_tenant;

-- 2. Ajouter un commentaire explicatif corrigé
COMMENT ON COLUMN rental_transactions.tenant_id IS 'Identifiant unique du locataire (généré depuis leases.id pour dénormalisation). Ne fait PAS référence à profiles car les locataires ne sont pas des utilisateurs de la plateforme.';

-- 3. Migration des données: Utiliser lease_id comme tenant_id temporairement
-- Explication: Puisqu'il n'y a pas de table tenants séparée, on peut:
-- - Option A: Laisser tenant_id NULL (état actuel, valide)
-- - Option B: Créer un hash basé sur tenant_name + tenant_email
-- - Option C: Utiliser lease.id comme identifiant unique du couple propriétaire-locataire

-- Pour l'instant, on garde NULL car c'est architecturalement correct
-- Si vous voulez créer une vraie table tenants à l'avenir, décommentez:
-- CREATE TABLE IF NOT EXISTS tenants (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     email TEXT,
--     phone TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
