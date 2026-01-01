# 🚀 Guide de Déploiement du Cron Job Mensuel

## Checklist de déploiement

### ✅ Étape 1 : Générer une clé secrète

```bash
openssl rand -base64 32
```

Ou utiliser un générateur en ligne : https://generate-secret.vercel.app/32

Copiez le résultat (exemple) : `8xK9mP2qW5vN7tL3jR6sH4fD1gY0cB5a` 

---

### ✅ Étape 2 : Configurer la variable d'environnement dans Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet **Dousell Immo**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Remplissez :
   - **Key** : `CRON_SECRET`
   - **Value** : `f1e61e17586eadf48e94d0e28c61ed7a` (votre clé générée)
   - **Environments** : Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

---

### ✅ Étape 3 : Déployer sur Vercel

#### Option A : Via Git (Recommandé)

```bash
git add .
git commit -m "feat: ajout cron job génération échéances mensuelles"
git push
```

Vercel va automatiquement déployer et détecter le fichier `vercel.json`.

#### Option B : Via CLI Vercel

```bash
npm install -g vercel
vercel --prod
```

---

### ✅ Étape 4 : Vérifier que le Cron est actif

1. Dans Vercel Dashboard, allez dans **Settings** → **Cron Jobs**
2. Vous devriez voir :

```
Path: /api/cron/generate-monthly-rentals
Schedule: 0 0 1 * * (Every month on day 1 at 00:00 UTC)
Status: Active ✅
```

---

### ✅ Étape 5 : Tester manuellement en production

```bash
curl -X GET https://dousell-immo.vercel.app/api/cron/generate-monthly-rentals \
  -H "Authorization: Bearer 8xK9mP2qW5vN7tL3jR6sH4fD1gY0cB5a"
```

**Réponse attendue** :

```json
{
  "success": true,
  "message": "X échéances générées",
  "created": X,
  "period": "12/2025"
}
```

---

### ✅ Étape 6 : Vérifier les logs

1. Vercel Dashboard → **Logs**
2. Recherchez : `generate-monthly-rentals`
3. Vérifiez qu'il n'y a pas d'erreurs

---

## 🔍 Vérification en base de données

Connectez-vous à Supabase et exécutez cette requête :

```sql
SELECT
    l.tenant_name,
    rt.period_month,
    rt.period_year,
    rt.amount_due,
    rt.status,
    rt.created_at
FROM rental_transactions rt
JOIN leases l ON l.id = rt.lease_id
WHERE rt.period_month = 12 AND rt.period_year = 2025
ORDER BY rt.created_at DESC;
```

Vous devriez voir toutes les échéances du mois en cours.

---

## 🛠️ Rollback en cas de problème

Si le Cron Job pose problème :

### Option 1 : Désactiver temporairement

Supprimez ou commentez dans `vercel.json` :

```json
{
  "crons": []
}
```

Puis redéployez.

### Option 2 : Supprimer les échéances créées par erreur

```sql
DELETE FROM rental_transactions
WHERE created_at >= '2025-12-01'
  AND status = 'pending'
  AND period_month = 12
  AND period_year = 2025;
```

---

## 📊 Monitoring recommandé

### Ajouter une alerte Slack/Email

Dans `app/api/cron/generate-monthly-rentals/route.ts`, ajoutez :

```typescript
// Après l'insertion réussie
if (insertedTrans.length > 0) {
    // Envoyer une notification
    await fetch('https://hooks.slack.com/services/YOUR_WEBHOOK', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `✅ ${insertedTrans.length} échéances créées pour ${currentMonth}/${currentYear}`
        })
    });
}
```

---

## ✅ C'est terminé !

Votre Cron Job est maintenant actif et s'exécutera automatiquement le **1er de chaque mois à 00:01 UTC**.

**Prochaine exécution** : 1er janvier 2026 à 00:01 UTC
