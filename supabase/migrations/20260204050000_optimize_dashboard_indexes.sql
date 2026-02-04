-- Optimisation des performances du Dashboard (Gestion Locative)
-- Date: 2026-02-04
-- Objectif: Réduire les timeouts sur getLeasesByOwner, getRevenueHistory, etc.

-- 1. Optimisation LEASES (Utilisé par getLeasesByOwner, getRentalStats)
-- Filtre principal par team_id
CREATE INDEX IF NOT EXISTS idx_leases_team_id ON public.leases(team_id);
-- Filtre combiné pour les statistiques (actifs vs terminés)
CREATE INDEX IF NOT EXISTS idx_leases_team_status ON public.leases(team_id, status);

-- 2. Optimisation RENTAL_TRANSACTIONS (Utilisé par getRentalStats, getRevenueHistory)
-- Filtre principal
CREATE INDEX IF NOT EXISTS idx_rental_transactions_team_id ON public.rental_transactions(team_id);
-- Pour getRentalStats (transactions du mois en cours) et getRevenueHistory (filtre par année)
CREATE INDEX IF NOT EXISTS idx_rental_transactions_team_period ON public.rental_transactions(team_id, period_year, period_month);
-- Pour rechercher les transactions d'un bail spécifique rapidement
CREATE INDEX IF NOT EXISTS idx_rental_transactions_lease_team ON public.rental_transactions(lease_id, team_id);
-- Pour le calcul des impayés (status)
CREATE INDEX IF NOT EXISTS idx_rental_transactions_team_status ON public.rental_transactions(team_id, status);

-- 3. Optimisation EXPENSES (Utilisé par getExpensesByOwner)
CREATE INDEX IF NOT EXISTS idx_expenses_team_id ON public.expenses(team_id);
CREATE INDEX IF NOT EXISTS idx_expenses_team_date ON public.expenses(team_id, expense_date);

-- 4. Optimisation MAINTENANCE_REQUESTS (Dashboard Maintenance)
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_team_status ON public.maintenance_requests(team_id, status);

-- 5. Optimisation PROPERTIES
-- (Normalement déjà indexé, mais pour être sûr)
CREATE INDEX IF NOT EXISTS idx_properties_team_id ON public.properties(team_id);

COMMENT ON INDEX idx_leases_team_id IS 'Performance index for fetching team leases';
COMMENT ON INDEX idx_rental_transactions_team_period IS 'Performance index for revenue stats';
