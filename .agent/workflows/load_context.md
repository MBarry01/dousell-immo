
---
description: Refresh and load AI context (rules and Supabase brain)
---

This workflow updates the component map and displays the relevant AI context files. Use this before starting implementation tasks to ensure you have the latest view of the codebase components AND strategic decisions.

1. Generate the latest project brain (Data + UI)
// turbo
npm run brain

2. Read the system rules
// turbo
type .cursorrules

3. Read the project brain
// turbo
type PROJECT_BRAIN.md

4. Read the component index
// turbo
type components/ui/index.ts

5. Read the workflow proposal (architecture & user flows)
// turbo
type docs/WORKFLOW_PROPOSAL.md

6. Read the remaining tasks (implementation status)
// turbo
type docs/REMAINING_TASKS.md

7. Read the Supabase brain (if exists - optional)
// turbo
type .ai/.supabase_brain.md

8. List available skills
// turbo
dir .agent\skills /B

9. Read rental payment skill (critical for Stripe/payment logic)
// turbo
type .agent\skills\rental-payments\SKILL.md

10. Security pre-flight check (AVANT tout travail sur API routes, webhooks, uploads, auth)
Vérifier que les patterns suivants sont respectés dans le fichier modifié :

a) Secrets webhook/cron → TOUJOURS obligatoires (jamais optionnels avec `if (secret)`)
   Mauvais : `if (WEBHOOK_SECRET) { ...vérifie... }` → accès libre si var absente
   Bon    : `if (!WEBHOOK_SECRET) return 500` puis vérification systématique

b) Guard NODE_ENV → JAMAIS pour les checks de sécurité
   Mauvais : `if (process.env.NODE_ENV === 'production') { vérifier auth }`
   Bon    : vérifier l'auth dans tous les environnements

c) Secret admin ≠ SUPABASE_SERVICE_ROLE_KEY
   Créer des variables dédiées (ex: ADMIN_CATCH_UP_SECRET) pour chaque endpoint admin

d) Upload fichier → valider MIME type ET extension côté serveur
   const ALLOWED = ['image/jpeg','image/png','image/webp'];
   if (!ALLOWED.includes(file.type)) return 400

e) Endpoint admin → GET et POST protégés de la même façon

f) dangerouslySetInnerHTML → uniquement pour JSON-LD/analytics (données internes fixes)
   Jamais pour contenu provenant de Supabase/utilisateurs → utiliser rendu React JSX

g) Erreurs serveur → logger en détail, renvoyer message générique au client
   Mauvais : `return NextResponse.json({ error: err.message })`
   Bon    : `console.error(err); return NextResponse.json({ error: 'Erreur interne' })`

Variables de sécurité attendues dans .env.local (toutes configurées — audit 2026-03-01) :
  ADMIN_CATCH_UP_SECRET → POST /api/admin/catch-up-ged
  APIFY_WEBHOOK_SECRET  → POST /api/webhooks/apify-sync
  CRON_SECRET           → GET  /api/cron/* (Vercel scheduled)
  CRON_SECRET_KEY       → Supabase Edge Function cleanup-access-control
  ADMIN_API_KEY         → GET+POST /api/admin/backfill-geocode
Si une de ces vars est absente → l'endpoint retourne 500 Config error (comportement attendu).
⚠️ Ces vars doivent aussi être dans Vercel Dashboard > Settings > Environment Variables.
