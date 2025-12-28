# Configuration des Cron Jobs - Dousell Immo

## 📋 Vue d'ensemble

Le système utilise deux cron jobs Vercel pour l'automatisation :

### 1. **Génération mensuelle des loyers**
- **Path**: `/api/cron/generate-monthly-rentals`
- **Schedule**: `0 0 1 * *` (Tous les 1er du mois à minuit UTC)
- **Fonction**: Crée automatiquement les transactions de loyer pour le mois en cours

### 2. **Relances automatiques J+5** ⚡ (NOUVEAU)
- **Path**: `/api/cron`
- **Schedule**: `0 9 * * *` (Tous les jours à 9h00 UTC = 9h00 GMT au Sénégal)
- **Fonction**: Envoie des relances par email aux locataires en retard de paiement (≥5 jours)

---

## ⚙️ Configuration Vercel

### Étape 1 : Variables d'environnement

Dans le dashboard Vercel, ajouter les variables suivantes :

```bash
# Optionnel - Sécurité cron job
CRON_SECRET=votre_secret_aleatoire_ici

# Déjà configurées (vérifier)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Étape 2 : Déploiement

Le fichier `vercel.json` contient déjà la configuration des crons :

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-rentals",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**IMPORTANT**: Les cron jobs Vercel nécessitent un **plan Pro** ($20/mois).

---

## 🧪 Tests

### Test en local (développement)

```bash
# Tester le cron de relances
curl http://localhost:3000/api/cron

# Tester la génération mensuelle
curl http://localhost:3000/api/cron/generate-monthly-rentals
```

### Test en production

```bash
# Avec CRON_SECRET (remplacer YOUR_SECRET)
curl -H "Authorization: Bearer YOUR_SECRET" https://dousell-immo.app/api/cron

# Sans sécurité (si CRON_SECRET non configuré)
curl https://dousell-immo.app/api/cron
```

### Réponse attendue (succès)

```json
{
  "success": true,
  "remindersSent": 3,
  "message": "3 reminder(s) sent successfully"
}
```

### Réponse attendue (aucune relance)

```json
{
  "success": true,
  "remindersSent": 0,
  "message": "No overdue payments found or all reminders already sent"
}
```

---

## 📊 Logs Vercel

### Vérifier l'exécution des crons

1. Aller dans **Vercel Dashboard** → Projet → **Deployments**
2. Cliquer sur **Functions**
3. Chercher `/api/cron` dans les logs
4. Vérifier les timestamps d'exécution

### Logs attendus

```
[CRON] Starting reminders processing...
[CRON] Reminders processing completed: { success: true, remindersSent: 2 }
```

---

## 🔒 Sécurité

### Protection contre les accès non autorisés

Le cron job vérifie le header `Authorization` en production :

```typescript
if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
}
```

**Recommandation**: Toujours configurer `CRON_SECRET` en production.

### Générer un secret sécurisé

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 🕐 Planning des exécutions

| Heure UTC | Heure Sénégal (GMT) | Action |
|-----------|---------------------|--------|
| 00:00     | 00:00              | Génération loyers (1er du mois) |
| 09:00     | 09:00              | Relances J+5 (quotidien) |

### Exemple de calendrier

```
1er Janvier 2025, 00:00 GMT → Création transactions Janvier 2025
6 Janvier 2025, 09:00 GMT   → Relance pour loyers dus le 1er (si non payés)
7 Janvier 2025, 09:00 GMT   → Relance pour loyers dus le 2 janvier (si non payés)
...
```

---

## 🐛 Dépannage

### Le cron ne s'exécute pas

**Vérifications** :
1. ✅ Plan Vercel Pro activé ?
2. ✅ Fichier `vercel.json` bien déployé ?
3. ✅ Variables d'environnement configurées ?
4. ✅ Pas d'erreurs dans les logs Vercel ?

### Les emails ne partent pas

**Vérifications** :
1. ✅ `GMAIL_USER` et `GMAIL_APP_PASSWORD` corrects ?
2. ✅ Gmail SMTP autorisé (pas de blocage Google) ?
3. ✅ Emails locataires valides dans la base ?
4. ✅ Colonne `reminder_sent` à `false` pour les transactions ?

### Tester manuellement le service

```typescript
// Dans un script TypeScript
import { createAdminClient } from '@/lib/supabase-admin';
import { internalProcessReminders } from '@/lib/reminders-service';

const supabase = createAdminClient();
const result = await internalProcessReminders(supabase);
console.log(result);
```

---

## 📝 Monitoring

### Créer une alerte Slack/Email (optionnel)

Modifier `/app/api/cron/route.ts` pour envoyer une notification :

```typescript
const result = await internalProcessReminders(supabaseAdmin);

// Notification si plus de 5 relances envoyées
if (result.remindersSent > 5) {
    await fetch('https://hooks.slack.com/services/YOUR_WEBHOOK', {
        method: 'POST',
        body: JSON.stringify({
            text: `⚠️ ${result.remindersSent} relances envoyées aujourd'hui`
        })
    });
}
```

---

## ✅ Checklist de déploiement

Avant de mettre en production :

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `CRON_SECRET` généré et configuré
- [ ] Plan Vercel Pro activé
- [ ] Test manuel du endpoint `/api/cron` réussi
- [ ] Vérification logs Vercel après premier déploiement
- [ ] Migration `20251228120000_add_reminder_sent.sql` appliquée en base
- [ ] Test d'envoi d'email manuel réussi

---

## 📚 Ressources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Dernière mise à jour** : 2025-12-28
**Version** : 1.0
**Auteur** : Dousell Immo Team
