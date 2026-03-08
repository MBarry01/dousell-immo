# Vercel Deployment - Facebook Marketplace Integration

## Pre-Deployment Checklist

- [ ] Tous les commits pushés à `origin/master`
- [ ] Code testé en local (webhooks répondent 200)
- [ ] Environment variables vérifiées en local

## Environment Variables à Ajouter sur Vercel

**URL:** https://vercel.com → Projet → Settings → Environment Variables

Ajouter ou vérifier ces variables:

```
# Facebook Marketplace Apify (nouveau)
APIFY_API_TOKEN_FACEBOOK=<votre_facebook_apify_token>

# Existants (vérifier)
APIFY_API_TOKEN=<votre_default_apify_token>
APIFY_API_TOKEN_EXPAT=<votre_expat_apify_token>

# Webhook (nouveau)
APIFY_WEBHOOK_SECRET=<votre_cron_secret>

# Supabase (existants)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cloudinary (existants)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dkkirzpxe
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Déploiement

### Option 1: Auto-Deploy (Recommandé)
- Vercel déploie automatiquement quand vous pushez à `master`
- Attendre ~3-5 minutes pour le build

### Option 2: Manual Deploy via CLI
```bash
npm install -g vercel@latest
vercel --prod
# Vérifier que les variables d'env sont présentes
# Confirmer le déploiement
```

### Option 3: Deploy via Dashboard
1. Aller sur https://vercel.com
2. Sélectionner le projet
3. Cliquer "Deployments"
4. Cliquer "Deploy Now"

## Post-Deployment Verification

### 1. Vérifier que le build s'est bien passé
- Dashboard Vercel → Deployments
- Voir le status: "Ready" (vert)
- Cliquer sur le déploiement pour voir les logs

### 2. Tester le webhook en production
```bash
curl -X POST https://www.dousel.com/api/webhooks/apify-sync?source=Facebook+Marketplace \
  -H "x-webhook-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"resource": {"defaultDatasetId": "TMzHvuFcxMQfD0HSy"}}'

# Devrait retourner: {"success":true,"source":"Facebook Marketplace",...}
```

### 3. Vérifier les logs
```bash
# Via Vercel CLI
vercel logs --prod

# Ou via Dashboard → Deployments → [Latest] → Logs
```

### 4. Tester la vitrine
- Aller sur https://www.dousel.com/recherche
- Vérifier que les annonces Facebook s'affichent
- Filtrés (SEULEMENT immobilier, pas de furniture)

## Apify Configuration (Production)

### 1. Configurer le scraper Apify
- Cibler Real Estate category: https://www.facebook.com/marketplace/category/real-estate/
- Ajouter ce scraper en input "startUrls"

### 2. Configurer le webhook Apify
- Aller à votre scraper Apify
- Settings → Webhooks
- Ajouter webhook:
  - **Event:** Dataset items finished
  - **URL:** `https://www.dousel.com/api/webhooks/apify-sync?source=Facebook+Marketplace`
  - **Headers:** `x-webhook-secret: [VOTRE_CRON_SECRET]`

### 3. Lancer un test du scraper
- Run the scraper with 10 pages
- Vérifier que:
  - ✅ Items retournés sont SEULEMENT immobilier
  - ✅ Webhook se déclenche
  - ✅ Données arrivent en Supabase
  - ✅ Listings affichées à `/recherche`

### 4. Planifier le scraper (2 jours)
- Scheduler Apify
- Fréquence: Every 2 days
- Time: 02:00 UTC
- Task: [Votre scraper]

## Monitoring (24h après)

Après 24h de production:

1. **Check stats**
   - Vérifier DB: `SELECT COUNT(*) FROM external_listings WHERE source_site = 'Facebook Marketplace'`
   - Vérifier images: `SELECT COUNT(DISTINCT image_url) FROM external_listings WHERE source_site = 'Facebook Marketplace'`

2. **Check logs**
   - Vercel logs pour les erreurs
   - Webhook success rate

3. **Check vitrine**
   - Images affichées? (Oui, pendant 24-48h)
   - Classification correcte? (Villa/Appartement/Terrain, Vente/Location)
   - Géocodage OK? (Coordonnées présentes)

## Rollback (si erreurs)

Si deployment pose problème:

```bash
# Voir les déploiements précédents
vercel deployments

# Revenir à un déploiement antérieur
vercel rollback
```

## Troubleshooting

**Problème:** Build fails
- Vérifier logs Vercel
- Vérifier TypeScript: `npm run tsc`
- Vérifier lint: `npm run lint`

**Problème:** Webhook retourne 500
- Vérifier env var `APIFY_WEBHOOK_SECRET`
- Vérifier logs: `vercel logs --prod`
- Tester en local d'abord

**Problème:** Images n'affichent pas
- Connu: Facebook bloque après 24-48h
- Attendre nouveau scrape dans 2 jours
- OU implémenter Cloudinary caching

## Success Criteria ✅

- [ ] Build green sur Vercel
- [ ] Webhook répond 200 en production
- [ ] 400+ annonces Facebook en DB
- [ ] Affichées sur `/recherche` (immobilier seulement)
- [ ] Filtre fonctionne (pas de furniture)
- [ ] Images affichées (24-48h)
- [ ] Scraper planifié (tous les 2 jours)
