# ✅ Système d'Alertes de Fin de Bail - Résumé

## 🎯 Objectif

Alerter automatiquement les propriétaires avant la fin d'un bail pour éviter la **tacite reconduction** involontaire, conformément au droit sénégalais.

## 📋 Règles Métier (Cadre juridique sénégalais)

### J-180 (6 mois avant)
**Alerte Stratégique** : Délai légal pour donner congé
- Si le propriétaire veut récupérer son bien
- Préavis de 6 mois signifié par huissier
- Sujet : 📅 "Action Requise : Fin de bail dans 6 mois"

### J-90 (3 mois avant)
**Alerte de Négociation** : Avant la tacite reconduction
- Moment pour discuter renouvellement ou ajustements
- Sans action, bail renouvelé automatiquement
- Sujet : 🔔 "Rappel : Fin de bail dans 3 mois"

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Vercel Cron (quotidien 08:00 UTC)                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ /api/cron/lease-expirations                         │
│ - Authentification CRON_SECRET                      │
│ - Appelle checkLeaseExpirations()                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ lib/lease-expiration-service.ts                     │
│ 1. Fetch baux actifs avec end_date                  │
│ 2. Calcul J-180 et J-90                            │
│ 3. Envoi emails propriétaires                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ lib/mail.ts (Gmail primaire / Supabase fallback)   │
└─────────────────────────────────────────────────────┘
```

## 📁 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `lib/lease-expiration-service.ts` | Service principal (logique métier) |
| `app/api/cron/lease-expirations/route.ts` | Endpoint Cron API |
| `supabase/migrations/20251228140000_add_end_date_to_leases.sql` | Migration DB |
| `scripts/test-lease-expirations.ts` | Script de test |
| `scripts/add-end-date-column.ts` | Utilitaire migration |
| `MARCHE_SENEGALAIS_BAUX.md` | Doc cadre juridique |
| `ALERTES_FIN_BAIL_DEPLOY.md` | Guide de déploiement |
| `vercel.json` | Config Cron (mise à jour) |
| `package.json` | Script npm `test:lease-expirations` |

## 🚀 Prochaines Étapes

### 1. Migration DB (OBLIGATOIRE)

Exécutez dans Supabase SQL Editor :

```sql
ALTER TABLE leases ADD COLUMN IF NOT EXISTS end_date DATE;

CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
```

### 2. Tester localement

```bash
npm run test:lease-expirations
```

### 3. Déployer sur Vercel

```bash
git add .
git commit -m "feat: alertes fin de bail J-180 et J-90"
git push
```

### 4. Vérifier le Cron

- Allez dans Vercel Dashboard → Settings → Cron Jobs
- Vérifiez que `/api/cron/lease-expirations` est listé
- Schedule : `0 8 * * *` (tous les jours à 08:00 UTC)

### 5. Ajouter des dates de fin sur vos baux

Dans l'UI ou via SQL :

```sql
UPDATE leases
SET end_date = '2025-12-31'
WHERE id = 'votre_lease_id';
```

## 🎨 Design

Email conforme au design system "Gestion Locative" :
- **Couleurs** : `slate-950`, `slate-900`, `green-500`, `red-500`, `yellow-500`
- **Responsive** : Mobile-first avec dark mode
- **Emojis** : 🏠 🇸🇳 📅 🔔 👤 🏘️ 💰

## 🧪 Tests

### Test local
```bash
npm run test:lease-expirations
```

### Test API (dev)
```bash
curl http://localhost:3000/api/cron/lease-expirations
```

### Test production
```bash
curl -H "Authorization: Bearer CRON_SECRET" \
  https://dousell-immo.vercel.app/api/cron/lease-expirations
```

## 📊 Monitoring

### Logs Vercel
- Dashboard → Logs → Filtre "cron"
- Recherchez : `[CRON] Traitement terminé: X alerte(s)`

### Métriques
- Nombre de baux actifs avec `end_date`
- Nombre d'alertes envoyées par jour
- Erreurs d'envoi d'email

## ⚙️ Configuration

### Variables d'environnement requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cron sécurité
CRON_SECRET=votre_secret_cron

# Email (Gmail)
GMAIL_USER=votre_email@gmail.com
GMAIL_APP_PASSWORD=mot_de_passe_app
FROM_EMAIL=Doussel Immo <noreply@doussel.immo>
```

### Cron Schedule (vercel.json)

```json
{
  "path": "/api/cron/lease-expirations",
  "schedule": "0 8 * * *"
}
```

## 🔒 Sécurité

- ✅ Authentification via `CRON_SECRET`
- ✅ Mode dev bypass pour tests locaux
- ✅ Admin client Supabase (Service Role)
- ✅ Validation des emails propriétaires

## 📚 Documentation

- [MARCHE_SENEGALAIS_BAUX.md](./MARCHE_SENEGALAIS_BAUX.md) - Cadre juridique
- [ALERTES_FIN_BAIL_DEPLOY.md](./ALERTES_FIN_BAIL_DEPLOY.md) - Guide complet

## ✅ Checklist Finale

- [x] Service métier créé (`lease-expiration-service.ts`)
- [x] API Cron créée (`/api/cron/lease-expirations`)
- [x] Migration DB préparée (`add_end_date_to_leases.sql`)
- [x] Tests écrits (`test-lease-expirations.ts`)
- [x] Cron configuré (`vercel.json`)
- [x] Design email adapté (couleurs gestion locative)
- [x] Documentation complète (3 fichiers MD)
- [x] Script npm ajouté (`test:lease-expirations`)
- [ ] Migration DB exécutée (À FAIRE)
- [ ] Code déployé sur Vercel (À FAIRE)
- [ ] Test en production validé (À FAIRE)

---

**Statut** : ✅ Développement terminé, prêt pour déploiement
**Prochaine action** : Exécuter la migration SQL dans Supabase
