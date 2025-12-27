# 🗓️ Génération Automatique des Échéances Mensuelles

## Vue d'ensemble

Ce système génère **automatiquement** les échéances de loyer (lignes dans `rental_transactions`) le **1er de chaque mois** pour tous les baux actifs.

### Avant ce système
❌ Les échéances étaient créées manuellement quand le propriétaire cliquait sur "Marqué payé"

### Avec ce système
✅ Chaque 1er du mois, le système crée automatiquement toutes les échéances
✅ Le propriétaire arrive sur son tableau de bord et voit déjà la ligne du mois en cours
✅ Il clique simplement sur "Marqué payé" quand le locataire a payé

---

## Architecture

### 1. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `app/api/cron/generate-monthly-rentals/route.ts` | Route API appelée par Vercel Cron |
| `vercel.json` | Configuration du déclencheur automatique |
| `scripts/test-cron-monthly-rentals.ts` | Script de test manuel en local |
| `.env.local` | Ajout de `CRON_SECRET` pour sécuriser l'accès |

### 2. Flux de fonctionnement

```
1er du mois 00:01 UTC
    ↓
Vercel Cron déclenche /api/cron/generate-monthly-rentals
    ↓
Vérification du secret CRON_SECRET
    ↓
Récupération de tous les baux actifs
    ↓
Pour chaque bail:
    - Vérifier si échéance existe déjà pour le mois
    - Si non → Créer une nouvelle ligne dans rental_transactions
    ↓
Fin du job (logs dans Vercel)
```

---

## Configuration

### Étape 1 : Variable d'environnement

Ajoutez dans vos **variables d'environnement Vercel** :

```bash
CRON_SECRET=votre_clé_secrète_très_forte_ici
```

⚠️ **Important** : Générez une vraie clé secrète aléatoire (ex: `openssl rand -base64 32`)

### Étape 2 : Déploiement

Le fichier `vercel.json` est déjà configuré :

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-rentals",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Schedule expliqué** : `0 0 1 * *`
- `0` : Minute 0
- `0` : Heure 0 (minuit UTC)
- `1` : 1er jour du mois
- `*` : Tous les mois
- `*` : Tous les jours de la semaine

### Étape 3 : Vérifier dans Vercel

Après déploiement :

1. Allez dans votre projet Vercel
2. **Settings** → **Cron Jobs**
3. Vous devriez voir : `/api/cron/generate-monthly-rentals` avec le schedule `0 0 1 * *`

---

## Test en local

### Tester le script manuellement

```bash
npm run test:cron-rentals
```

Ce script :
- ✅ Se connecte à votre Supabase
- ✅ Liste tous les baux actifs
- ✅ Crée les échéances manquantes pour le mois en cours
- ✅ Affiche un rapport détaillé

### Exemple de sortie

```
🚀 TEST DU CRON JOB - Génération des échéances mensuelles

📋 3 bail(s) actif(s) trouvé(s)

📅 Génération pour 12/2025

⏭️  [Amadou Diallo] Échéance déjà existante
➕ [Fatou Sall] Nouvelle échéance à créer (150000 FCFA)
➕ [Moussa Ba] Nouvelle échéance à créer (200000 FCFA)

📊 Résumé:
   - Échéances existantes: 1
   - Échéances à créer: 2

✅ 2 échéance(s) créée(s) avec succès

📝 Détails des échéances créées:
   1. Transaction ID: 8f3e4a...
      - Montant: 150000 FCFA
      - Période: 12/2025
      - Statut: pending
   2. Transaction ID: 9a2b1c...
      - Montant: 200000 FCFA
      - Période: 12/2025
      - Statut: pending
```

---

## Sécurité

### Protection de la route

La route `/api/cron/generate-monthly-rentals` est protégée par :

1. **Header Authorization** : `Bearer ${CRON_SECRET}`
2. Si le secret ne correspond pas → `401 Unauthorized`

### Appel manuel (pour test en production)

```bash
curl -X GET https://dousell-immo.vercel.app/api/cron/generate-monthly-rentals \
  -H "Authorization: Bearer votre_CRON_SECRET_ici"
```

---

## Monitoring & Logs

### Voir les logs dans Vercel

1. Vercel Dashboard → **Logs**
2. Filtrer par : `generate-monthly-rentals`
3. Vous verrez :
   - `🚀 CRON JOB DÉMARRÉ`
   - `📅 Génération pour X/YYYY`
   - `✅ N échéances créées`

### Que faire en cas d'erreur ?

Si le Cron Job échoue :

1. **Vérifier les logs Vercel** pour voir l'erreur
2. **Vérifier que `CRON_SECRET` est bien configuré**
3. **Tester manuellement** avec `npm run test:cron-rentals`
4. **Appeler manuellement l'API** avec curl (voir ci-dessus)

---

## FAQ

### Q : Que se passe-t-il si j'ai déjà créé manuellement l'échéance du mois ?
**R** : Le script vérifie si l'échéance existe déjà. Si oui, il la saute (pas de doublon).

### Q : Le Cron Job peut-il s'exécuter plusieurs fois le 1er du mois ?
**R** : Vercel Cron est idempotent. Même s'il s'exécute 2 fois, il ne créera pas de doublon grâce à la vérification.

### Q : Comment changer l'heure de déclenchement ?
**R** : Modifiez le `schedule` dans `vercel.json`. Exemple pour 8h du matin : `"0 8 1 * *"`

### Q : Est-ce que cela fonctionne en développement local ?
**R** : Non, Vercel Cron ne fonctionne qu'en production. Pour tester en local, utilisez `npm run test:cron-rentals`.

### Q : Puis-je forcer la génération pour un mois spécifique ?
**R** : Oui, modifiez temporairement le script de test pour définir le mois manuellement :

```typescript
// Dans scripts/test-cron-monthly-rentals.ts
const currentMonth = 1; // Janvier
const currentYear = 2026;
```

---

## Prochaines améliorations possibles

- [ ] Notification email aux propriétaires après génération des échéances
- [ ] Dashboard admin pour voir l'historique des exécutions
- [ ] Support multi-devises
- [ ] Génération d'échéances trimestrielles ou annuelles
- [ ] Intégration avec Make.com pour envoyer automatiquement les avis d'échéance

---

## Support

Pour toute question, contactez l'équipe technique ou consultez :
- Documentation Vercel Cron : https://vercel.com/docs/cron-jobs
- Documentation Supabase : https://supabase.com/docs
