# 🚀 Déploiement du Système d'Alertes de Fin de Bail

## Vue d'ensemble

Système d'alertes automatiques conforme au cadre juridique sénégalais (COCC + décret 2014 + loi 2024) :
- **J-180 (6 mois)** : Alerte stratégique pour congé propriétaire (délai légal)
- **J-90 (3 mois)** : Alerte de négociation avant tacite reconduction

## 📁 Fichiers créés

### 1. Service principal
- `lib/lease-expiration-service.ts` - Logique métier des alertes
- `MARCHE_SENEGALAIS_BAUX.md` - Documentation du cadre juridique

### 2. API Cron
- `app/api/cron/lease-expirations/route.ts` - Endpoint pour Vercel Cron

### 3. Configuration
- `vercel.json` - Configuration Cron (quotidien à 08:00)

### 4. Migration DB
- `supabase/migrations/20251228140000_add_end_date_to_leases.sql`

### 5. Scripts utilitaires
- `scripts/add-end-date-column.ts` - Ajout de la colonne end_date
- `scripts/test-lease-expirations.ts` - Test du service

## 🔧 Installation

### Étape 1 : Migration de la base de données

Exécutez cette commande SQL dans l'éditeur Supabase (SQL Editor) :

\`\`\`sql
-- Ajouter la colonne end_date
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Commentaire
COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
\`\`\`

### Étape 2 : Vérifier la configuration Cron

Le fichier `vercel.json` doit contenir :

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/lease-expirations",
      "schedule": "0 8 * * *"
    }
  ]
}
\`\`\`

**Schedule** : `0 8 * * *` = Tous les jours à 08:00 UTC (09:00 heure Sénégal en hiver, 08:00 en été)

### Étape 3 : Variables d'environnement

Vérifiez que ces variables sont configurées dans Vercel :

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CRON_SECRET=votre_secret_cron
FROM_EMAIL=Doussel Immo <noreply@doussel.immo>
GMAIL_USER=votre_email@gmail.com
GMAIL_APP_PASSWORD=votre_mot_de_passe_app
\`\`\`

### Étape 4 : Déployer sur Vercel

\`\`\`bash
git add .
git commit -m "feat: système d'alertes de fin de bail (J-180 et J-90)"
git push
\`\`\`

Vercel détectera automatiquement la configuration Cron.

## 🧪 Tests

### Test local (développement)

\`\`\`bash
# Tester le service
npx tsx scripts/test-lease-expirations.ts
\`\`\`

### Test via l'API locale

\`\`\`bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal
curl http://localhost:3000/api/cron/lease-expirations
\`\`\`

### Test en production (Vercel)

\`\`\`bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  https://dousell-immo.vercel.app/api/cron/lease-expirations
\`\`\`

## 📝 Utilisation

### 1. Définir une date de fin de bail

Dans l'interface de gestion locative, ajoutez une `end_date` à vos baux actifs.

**Exemple SQL (pour tests)** :

\`\`\`sql
-- Bail qui expire dans 6 mois (alerte J-180 aujourd'hui)
UPDATE leases
SET end_date = CURRENT_DATE + INTERVAL '6 months'
WHERE id = 'votre_lease_id';

-- Bail qui expire dans 3 mois (alerte J-90 aujourd'hui)
UPDATE leases
SET end_date = CURRENT_DATE + INTERVAL '3 months'
WHERE id = 'votre_lease_id';
\`\`\`

### 2. Réception des alertes

Les propriétaires recevront un email :
- **J-180** : Sujet "📅 Action Requise : Fin de bail dans 6 mois"
- **J-90** : Sujet "🔔 Rappel : Fin de bail dans 3 mois"

## 🎨 Design Email

Le template email suit le design system de la page gestion locative :
- Couleurs : `slate-950`, `slate-900`, `green-500`, `red-500`, `yellow-500`
- Responsive et dark mode
- Emojis : 🏠 🇸🇳 📅 🔔 👤 🏘️ 💰

## 📊 Monitoring

### Logs Vercel

Allez dans Vercel Dashboard → Votre projet → Logs → Filtre "Cron"

### Vérifier l'exécution

\`\`\`bash
# Dans les logs, cherchez :
# ✅ [CRON] Traitement terminé: X alerte(s) envoyée(s)
\`\`\`

## 🐛 Dépannage

### Aucune alerte envoyée

1. Vérifiez que `end_date` est définie sur vos baux actifs
2. Vérifiez que la date correspond à J-180 ou J-90 exactement
3. Vérifiez les logs Vercel pour voir les erreurs

### Erreur d'email

1. Vérifiez `GMAIL_USER` et `GMAIL_APP_PASSWORD`
2. Vérifiez que l'email du propriétaire existe dans Supabase Auth

### Cron ne se déclenche pas

1. Vérifiez que `vercel.json` est bien committé
2. Vérifiez dans Vercel Dashboard → Settings → Cron Jobs
3. Attendez le prochain cycle (08:00 UTC)

## 📚 Références

- [MARCHE_SENEGALAIS_BAUX.md](./MARCHE_SENEGALAIS_BAUX.md) - Cadre juridique
- [lib/lease-expiration-service.ts](./lib/lease-expiration-service.ts) - Code source
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée (colonne `end_date` ajoutée)
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Code déployé sur Vercel
- [ ] Cron configuré dans `vercel.json`
- [ ] Test local réussi
- [ ] Test en production réussi
- [ ] Email de test reçu
- [ ] Documentation lue et comprise

---

**Support** : En cas de problème, vérifiez les logs Vercel ou contactez l'équipe technique.
