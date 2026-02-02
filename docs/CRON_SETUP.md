# Configuration CRON - Cleanup Access Control

Date: 2 Février 2026

## Déploiement Supabase Edge Function

```bash
# Déployer
supabase functions deploy cleanup-access-control

# Configurer le CRON (toutes les heures)
supabase functions schedule cleanup-access-control "0 * * * *"

# Variables d'environnement requises
CRON_SECRET_KEY=your-secret-key
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## Test Manuel

```bash
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-access-control \
  -H "Authorization: Bearer your-secret-key"
```

Voir docs/CRON_SETUP.md complet pour plus de détails.
