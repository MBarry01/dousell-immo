-- =====================================================
-- DOCUMENTATION: CRÉATION D'ÉQUIPE AUTOMATIQUE
-- Dousell Immo - Gestion Locative
-- =====================================================
--
-- L'équipe personnelle est créée AUTOMATIQUEMENT via le code
-- quand l'utilisateur visite /gestion/config pour la première fois.
--
-- FLUX:
-- 1. L'utilisateur se connecte
-- 2. Il va sur /gestion/config (Configuration Premium)
-- 3. Le système vérifie s'il a une équipe (getUserTeamContext)
-- 4. Si non → création automatique de "Espace de [nom]"
-- 5. L'utilisateur peut maintenant accéder à /gestion/biens
--
-- FICHIERS CONCERNÉS:
-- - lib/team-permissions.ts → fonction createPersonalTeam()
-- - app/(workspace)/gestion/config/page.tsx → appel de getUserTeamContext()
--
-- =====================================================

-- Script de vérification (lecture seule)
SELECT 
  u.email,
  COALESCE(t.name, '❌ PAS D''ÉQUIPE') as team_name,
  tm.role,
  tm.status
FROM auth.users u
LEFT JOIN team_members tm ON tm.user_id = u.id AND tm.status = 'active'
LEFT JOIN teams t ON t.id = tm.team_id
ORDER BY u.email;
