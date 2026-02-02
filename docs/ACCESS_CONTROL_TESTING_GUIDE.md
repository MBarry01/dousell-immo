# Guide de Test - Système de Contrôle d'Accès Temporaire

**Date**: 2 Février 2026
**Version**: 1.0
**Statut**: ✅ Prêt pour test

---

## 📋 Pré-requis

### 1. Variables d'Environnement

Assurez-vous que ces variables sont configurées:

```bash
# .env.local
CRON_SECRET_KEY=your-super-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou votre URL de production
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Migrations SQL

Appliquer toutes les migrations:

```bash
# Depuis le répertoire du projet
supabase db push

# Ou appliquer manuellement les migrations dans l'ordre:
# 1. 20260202120000_migrate_subscription_schema.sql
# 2. 20260202140000_create_access_control_schema.sql
# 3. 20260202141000_update_get_active_temporary_permissions.sql
```

### 3. Démarrage de l'Application

```bash
npm run dev
```

---

## 🧪 Tests Unitaires

### Test 1: Vérifier les Tables SQL

```sql
-- Dans Supabase SQL Editor
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('access_requests', 'temporary_permissions');

-- Vérifier les fonctions RPC
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%permission%';
```

**Résultat attendu**:
- 2 tables: `access_requests`, `temporary_permissions`
- 3 fonctions: `has_temporary_permission`, `get_active_temporary_permissions`, `cleanup_expired_permissions`

---

### Test 2: Demande d'Accès (Frontend)

**Étapes**:
1. Se connecter avec un compte membre d'une équipe (rôle: `member` ou `viewer`)
2. Aller sur `/gestion`
3. Tenter une action restreinte (ex: éditer un bail)
4. Cliquer sur "Demander l'accès temporaire"
5. Remplir le formulaire:
   - Permission: `leases.edit`
   - Raison: "Test demande d'accès"
   - Durée: 4 heures
6. Soumettre la demande

**Résultat attendu**:
- ✅ Toast de succès: "Demande envoyée avec succès"
- ✅ Email envoyé aux owners/managers de l'équipe
- ✅ Nouvelle ligne dans `access_requests` avec `status = 'pending'`

**Vérification SQL**:
```sql
SELECT * FROM public.access_requests
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 3: Approuver une Demande (Manager/Owner)

**Étapes**:
1. Se connecter avec un compte owner/manager
2. Aller sur `/gestion/access-control`
3. Voir la liste des demandes en attente
4. Cliquer sur "Approuver" pour une demande
5. Remplir les notes de révision (optionnel)
6. Confirmer l'approbation

**Résultat attendu**:
- ✅ Demande passe à `status = 'approved'`
- ✅ Nouvelle ligne créée dans `temporary_permissions`
- ✅ Email envoyé au demandeur avec détails de l'accès
- ✅ Le demandeur peut maintenant effectuer l'action

**Vérification SQL**:
```sql
-- Vérifier la demande approuvée
SELECT * FROM public.access_requests
WHERE status = 'approved'
ORDER BY updated_at DESC
LIMIT 1;

-- Vérifier la permission temporaire créée
SELECT * FROM public.temporary_permissions
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 4: Widget Sidebar - Permissions Actives

**Étapes**:
1. Se connecter avec le compte qui a reçu la permission temporaire
2. Aller sur `/gestion`
3. Observer la sidebar gauche

**Résultat attendu**:
- ✅ Widget "Accès temporaires" visible avec badge indiquant le nombre de permissions (ex: `1`)
- ✅ Cliquer sur le widget affiche la liste déroulante
- ✅ Chaque permission affiche:
  - Nom de la permission (ex: "Éditer baux")
  - Temps restant (ex: "4h" ou "55 min")
  - Raison (si fournie)
- ✅ Lien "Voir tous les accès" vers `/gestion/access-control`
- ✅ Auto-refresh toutes les 30 secondes

**Vérification visuelle**:
- Badge orange avec le nombre de permissions
- Icône clé (`LockKey`)
- Highlight rouge si expiration < 1h

---

### Test 5: Rejeter une Demande (Manager/Owner)

**Étapes**:
1. Créer une nouvelle demande (voir Test 2)
2. Se connecter avec un compte owner/manager
3. Aller sur `/gestion/access-control`
4. Cliquer sur "Rejeter" pour la demande
5. Ajouter une note de refus: "Accès non nécessaire pour cette tâche"
6. Confirmer le refus

**Résultat attendu**:
- ✅ Demande passe à `status = 'rejected'`
- ✅ Email envoyé au demandeur avec raison du refus
- ✅ Pas de permission temporaire créée

**Vérification SQL**:
```sql
SELECT * FROM public.access_requests
WHERE status = 'rejected'
ORDER BY updated_at DESC
LIMIT 1;
```

---

### Test 6: API Route - Notification d'Expiration

**Test Manuel**:

```bash
# Créer une permission temporaire expirant dans 30 min
curl -X POST http://localhost:3000/api/cron/send-expiring-notification \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "your-team-id",
    "userId": "your-user-id",
    "permission": "leases.edit",
    "expiresAt": "2026-02-02T12:30:00Z"
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "timestamp": "2026-02-02T11:30:00.000Z"
}
```

**Vérification**:
- ✅ Email reçu avec sujet: "⏰ Votre accès temporaire expire dans Xh"
- ✅ Contenu de l'email affiche le temps restant et la permission

---

### Test 7: CRON Job - Cleanup Automatique

**Test Local (Sans Edge Function)**:

Créer un script de test:

```typescript
// scripts/test-cleanup-cron.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCleanup() {
  console.log('🧹 Testing cleanup...');

  // Appeler la fonction de cleanup
  const { data, error } = await supabase.rpc('cleanup_expired_permissions');

  if (error) {
    console.error('❌ Cleanup error:', error);
  } else {
    console.log(`✅ Cleanup success: ${data} permissions deleted`);
  }
}

testCleanup();
```

```bash
# Exécuter le test
npx tsx scripts/test-cleanup-cron.ts
```

**Résultat attendu**:
- ✅ Permissions expirées supprimées de `temporary_permissions`
- ✅ Demandes correspondantes marquées comme `expired`

---

### Test 8: Déploiement Edge Function (Production)

**Déploiement**:

```bash
# 1. Déployer l'Edge Function
supabase functions deploy cleanup-access-control

# 2. Configurer les variables d'environnement
supabase secrets set CRON_SECRET_KEY=your-secret-key
supabase secrets set NEXT_PUBLIC_APP_URL=https://dousell.com
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Configurer le CRON (toutes les heures)
supabase functions schedule cleanup-access-control "0 * * * *"
```

**Test Manuel**:

```bash
# Appeler l'Edge Function manuellement
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-access-control \
  -H "Authorization: Bearer your-secret-key"
```

**Résultat attendu**:
```json
{
  "success": true,
  "result": {
    "deletedPermissions": 2,
    "expiringSoon": 1,
    "notificationsSent": 1,
    "errors": []
  },
  "timestamp": "2026-02-02T12:00:00.000Z"
}
```

---

## 🔍 Tests d'Intégration

### Scénario Complet: Cycle de Vie d'une Permission Temporaire

**Étape 1**: Demande d'accès (Member)
- Se connecter comme `member`
- Demander permission `leases.edit` pour 2 heures
- ✅ Email reçu par managers

**Étape 2**: Approbation (Manager)
- Se connecter comme `manager`
- Approuver la demande
- ✅ Email reçu par member
- ✅ Widget sidebar affiche la permission

**Étape 3**: Utilisation de la Permission
- Se connecter comme `member`
- Tester l'action restreinte (éditer un bail)
- ✅ Action autorisée grâce à la permission temporaire

**Étape 4**: Notification d'Expiration (CRON)
- Attendre 1h (ou modifier `expires_at` en SQL)
- ✅ CRON détecte la permission expirant bientôt
- ✅ Email d'avertissement envoyé

**Étape 5**: Expiration Automatique (CRON)
- Attendre l'expiration complète
- ✅ CRON supprime la permission expirée
- ✅ Widget sidebar ne l'affiche plus
- ✅ Action restreinte n'est plus autorisée

---

## 📊 Monitoring & Logs

### Logs à Surveiller

**Application Next.js**:
```bash
# Logs des notifications
[Access Request] Notification sent to managers
[Access Approved] Notification sent to requester
[Access Expiring] Notification sent to user
```

**Supabase Edge Function**:
```bash
# Voir les logs dans le dashboard Supabase
# Functions > cleanup-access-control > Logs
```

**Vérifications Quotidiennes**:

```sql
-- Nombre de demandes par statut
SELECT status, COUNT(*)
FROM public.access_requests
GROUP BY status;

-- Permissions temporaires actives
SELECT COUNT(*) as active_permissions
FROM public.temporary_permissions
WHERE expires_at > NOW();

-- Permissions expirant dans les 24h
SELECT COUNT(*) as expiring_soon
FROM public.temporary_permissions
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours';
```

---

## 🐛 Troubleshooting

### Problème: Emails non reçus

**Solutions**:
1. Vérifier les credentials Gmail dans `.env.local`
2. Tester l'envoi manuel:
   ```bash
   npm run test:email
   ```
3. Vérifier les logs Next.js pour les erreurs d'envoi

### Problème: Widget non affiché

**Solutions**:
1. Vérifier que la migration RPC inclut l'`id`:
   ```sql
   SELECT id, permission, expires_at
   FROM public.temporary_permissions
   LIMIT 1;
   ```
2. Ouvrir la console navigateur et vérifier les erreurs
3. Vérifier que `useTeamContext()` retourne bien `teamId` et `user.id`

### Problème: CRON ne s'exécute pas

**Solutions**:
1. Vérifier la configuration du schedule:
   ```bash
   supabase functions list
   ```
2. Vérifier les secrets Supabase:
   ```bash
   supabase secrets list
   ```
3. Tester manuellement l'Edge Function (voir Test 8)

### Problème: Permissions non expirées supprimées

**Vérification**:
```sql
-- Vérifier les timestamps
SELECT
  id,
  permission,
  expires_at,
  NOW() as current_time,
  expires_at > NOW() as is_active
FROM public.temporary_permissions;
```

---

## ✅ Checklist Finale

### Backend
- [ ] Migrations SQL appliquées
- [ ] Fonctions RPC créées et testées
- [ ] RLS policies actives
- [ ] Triggers fonctionnels

### Frontend
- [ ] Formulaire de demande d'accès fonctionne
- [ ] Dashboard access-control affiche les demandes
- [ ] Actions approuver/rejeter fonctionnent
- [ ] Widget sidebar affiche les permissions actives
- [ ] Auto-refresh du widget fonctionne

### Notifications
- [ ] Email demande d'accès (vers managers)
- [ ] Email approbation (vers requester)
- [ ] Email rejet (vers requester)
- [ ] Email expiration (1h avant)
- [ ] Templates HTML s'affichent correctement

### CRON
- [ ] Edge Function déployée
- [ ] CRON schedule configuré
- [ ] Cleanup des permissions expirées fonctionne
- [ ] Notifications d'expiration envoyées
- [ ] Logs accessibles et lisibles

### Sécurité
- [ ] RLS active sur toutes les tables
- [ ] Auth vérifiée pour toutes les Server Actions
- [ ] CRON protégé par secret key
- [ ] Validation Zod pour tous les inputs

---

## 🎯 Résultats Attendus

À la fin des tests, vous devriez avoir:

✅ **0 erreurs** dans les tests unitaires
✅ **100% des scénarios** d'intégration réussis
✅ **Tous les emails** envoyés et reçus correctement
✅ **Widget sidebar** fonctionnel et temps réel
✅ **CRON job** s'exécutant toutes les heures
✅ **Logs** propres sans erreurs

---

**Date de création**: 2 Février 2026
**Auteur**: Claude (Sonnet 4.5)
**Version du système**: 1.0 - Production Ready ✅
