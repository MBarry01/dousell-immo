# 🚀 Plan d'Action - Déploiement n8n pour Baraka Immo

## 📋 Vue d'ensemble

Ce document vous guide étape par étape pour mettre en production le système d'envoi automatique de quittances de loyer via WhatsApp et Email.

**Durée estimée** : 2-4 heures (selon votre familiarité avec les outils)

---

## ✅ Phase 1 : Préparation des Comptes (30-60 min)

### 1.1 Créer un compte n8n Cloud

- [ ] Allez sur https://n8n.io/cloud
- [ ] Cliquez sur **"Start for Free"**
- [ ] Créez un compte (Email + Mot de passe)
- [ ] Choisissez le plan **Starter** (gratuit, 2500 exécutions/mois)
- [ ] Notez votre URL : `https://[votre-id].app.n8n.cloud`

**Alternative** : Self-hosted avec Docker
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 1.2 Créer un compte Cloudinary

- [ ] Allez sur https://cloudinary.com/users/register/free
- [ ] Créez un compte gratuit
- [ ] Dans le Dashboard, notez :
  - **Cloud Name** (ex: `dousell-immo`)
  - Créez un **Upload Preset** non signé :
    1. Settings → Upload → Upload Presets
    2. "Add upload preset"
    3. Nom : `baraka-immo-receipts`
    4. Mode : **Unsigned**
    5. Folder : `baraka-immo/receipts`
    6. Save

### 1.3 Configurer WhatsApp Business API

**Option A : Via Meta (gratuit mais long)**

- [ ] Créez un compte Facebook Business Manager
- [ ] Allez sur https://developers.facebook.com
- [ ] Créez une app de type **Business**
- [ ] Ajoutez le produit **WhatsApp**
- [ ] Vérifiez votre numéro de téléphone dédié
- [ ] Notez :
  - **Phone Number ID**
  - **Access Token** (généré dans Configuration)
- [ ] **Délai** : 1-3 jours pour validation complète

**Option B : Via Twilio (payant mais rapide)**

- [ ] Compte Twilio : https://www.twilio.com/try-twilio
- [ ] Activez WhatsApp Sandbox (test gratuit)
- [ ] Ou achetez un numéro WhatsApp Business (~$15/mois)
- [ ] Notez :
  - **Account SID**
  - **Auth Token**
  - **WhatsApp Number**

---

## ✅ Phase 2 : Configuration n8n (30-45 min)

### 2.1 Importer le workflow

- [ ] Connectez-vous à votre instance n8n
- [ ] Menu (☰) → **Import from File**
- [ ] Sélectionnez `docs/n8n-workflow-auto-receipt.json`
- [ ] Le workflow apparaît sur le canvas

### 2.2 Configurer les variables d'environnement

- [ ] Dans n8n, allez dans **Settings → Environments**
- [ ] Ajoutez les variables suivantes :

```env
# WhatsApp (Meta)
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_PHONE_ID=123456789012345

# OU WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_UPLOAD_PRESET=baraka-immo-receipts
```

### 2.3 Configurer les credentials

#### Gmail OAuth2

- [ ] Credentials → New → **Gmail OAuth2**
- [ ] Suivez le processus d'authentification Google
- [ ] Autorisez l'envoi d'emails
- [ ] Nommez : `Gmail Account`

#### WhatsApp (si Meta)

- [ ] Credentials → New → **HTTP Header Auth** ou **Generic Credential Type**
- [ ] Name : `WhatsApp Business`
- [ ] Type : `Bearer Token`
- [ ] Token : Collez votre `WHATSAPP_TOKEN`

### 2.4 Activer le webhook

- [ ] Ouvrez le nœud **"Webhook Trigger"**
- [ ] Cliquez sur **"Listen for Test Event"**
- [ ] **COPIEZ l'URL** affichée :
  ```
  https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow
  ```
- [ ] Basculez le workflow sur **ACTIVE** (toggle en haut à droite)

---

## ✅ Phase 3 : Intégration Application (15 min)

### 3.1 Configurer l'URL dans .env.local

- [ ] Ouvrez le fichier `.env.local` de votre projet
- [ ] Remplacez l'URL placeholder :

```env
# Avant
NEXT_PUBLIC_N8N_URL="https://votre-instance-n8n.com/webhook/auto-receipt-flow"

# Après (avec votre vraie URL)
NEXT_PUBLIC_N8N_URL="https://abc123.app.n8n.cloud/webhook/auto-receipt-flow"
```

### 3.2 Redémarrer l'application

```bash
# Arrêtez le serveur de dev (Ctrl+C)
npm run dev
```

---

## ✅ Phase 4 : Tests (20-30 min)

### 4.1 Test depuis le script

```bash
npm run test:n8n
```

**Résultat attendu** :
```
✅ SUCCESS!
📊 Réponse du webhook:
{
  "success": true,
  "message": "Quittance envoyée avec succès",
  ...
}
```

### 4.2 Test depuis l'application

- [ ] Allez sur http://localhost:3000/compte/gestion-locative
- [ ] Créez un bail de test (si pas déjà fait)
- [ ] Cliquez sur **"Générer quittance"**
- [ ] Dans la modale, cliquez sur **"Envoyer"**
- [ ] Vérifiez :
  - [ ] Message de succès dans l'app
  - [ ] Notification de réception (si configuré)

### 4.3 Vérifier la réception

**WhatsApp** :
- [ ] Le locataire reçoit l'image de la quittance
- [ ] Le message est bien formaté avec émojis
- [ ] L'image s'affiche correctement

**Email** :
- [ ] L'email arrive dans la boîte de réception
- [ ] Le HTML est bien rendu
- [ ] L'image de la quittance est attachée et visible
- [ ] Vérifiez les spams si non reçu

### 4.4 Logs et monitoring

Dans n8n :
- [ ] Menu → **Executions**
- [ ] Vérifiez les exécutions récentes
- [ ] Tous les nœuds doivent être **verts** ✅
- [ ] Temps d'exécution : environ 3-5 secondes

---

## ✅ Phase 5 : Optimisations (optionnel, 30-60 min)

### 5.1 Template WhatsApp Business (recommandé)

- [ ] Suivez le guide `docs/WHATSAPP-TEMPLATE-SUBMISSION.md`
- [ ] Soumettez le template `quittance_loyer` sur Meta Business Manager
- [ ] Attendez l'approbation (24-48h)
- [ ] Une fois approuvé, activez le nœud **"Send WhatsApp (Template)"** dans n8n
- [ ] Désactivez **"Send WhatsApp (Direct)"**

### 5.2 Sécuriser le webhook (recommandé)

Ajoutez une clé secrète pour authentifier les requêtes :

**Dans `.env.local`** :
```env
N8N_WEBHOOK_SECRET=votre-cle-secrete-aleatoire-32-caracteres
```

**Dans n8n (nœud "Validate Data")**, ajoutez :
```javascript
const secret = $input.first().json.headers['x-webhook-secret'];
if (secret !== '{{$env.N8N_WEBHOOK_SECRET}}') {
  throw new Error('Unauthorized');
}
```

**Dans `ReceiptModal.tsx`** :
```typescript
const response = await fetch(process.env.NEXT_PUBLIC_N8N_URL!, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET!,
  },
  body: JSON.stringify(payload),
});
```

### 5.3 Notifications pour le propriétaire

Ajoutez un nœud pour notifier le propriétaire après chaque envoi :

- [ ] Ajoutez un nœud **Email** ou **Slack** après "Log Success"
- [ ] Message type :
  ```
  ✅ Quittance envoyée à [Locataire]
  💰 Montant : [Montant]
  📅 Période : [Mois]
  📱 Envoyé par : WhatsApp + Email
  ```

### 5.4 Stockage historique (optionnel)

Enregistrez chaque envoi dans Supabase :

- [ ] Ajoutez un nœud **Supabase** ou **HTTP Request**
- [ ] Créez une table `receipt_logs` :
```sql
CREATE TABLE receipt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES users(id),
  receipt_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  period TEXT NOT NULL,
  sent_via TEXT[], -- ['whatsapp', 'email']
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'delivered'
);
```

---

## ✅ Phase 6 : Mise en Production (15 min)

### 6.1 Déployer sur Vercel

```bash
# Commit les changements
git add .env.local docs/ scripts/test-n8n-webhook.ts
git commit -m "feat: add n8n webhook integration for receipt sending"

# Push vers Vercel (si configuré)
git push
```

### 6.2 Configurer les variables d'environnement sur Vercel

- [ ] Allez sur https://vercel.com/dashboard
- [ ] Sélectionnez votre projet **dousell-immo**
- [ ] Settings → Environment Variables
- [ ] Ajoutez :
  ```
  NEXT_PUBLIC_N8N_URL = https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow
  ```
- [ ] Redéployez : **Deployments → Redeploy**

### 6.3 Test en production

- [ ] Allez sur https://dousell-immo.vercel.app/compte/gestion-locative
- [ ] Générez et envoyez une quittance de test
- [ ] Vérifiez la réception

---

## 📊 Checklist de Validation Finale

Avant de considérer le système opérationnel :

- [ ] ✅ Webhook n8n actif et accessible
- [ ] ✅ Variables d'environnement configurées (n8n + Vercel)
- [ ] ✅ Credentials Gmail configurées et fonctionnelles
- [ ] ✅ WhatsApp configuré et teste avec succès
- [ ] ✅ Cloudinary upload fonctionne
- [ ] ✅ Test du script `npm run test:n8n` réussi
- [ ] ✅ Test depuis l'application réussi
- [ ] ✅ Email reçu correctement
- [ ] ✅ WhatsApp reçu correctement
- [ ] ✅ Images affichées dans les deux canaux
- [ ] ✅ Logs n8n propres (pas d'erreurs)
- [ ] ✅ Temps de réponse < 10 secondes

---

## 🔧 Troubleshooting Rapide

### Le webhook retourne 404
➡️ Vérifiez que le workflow n8n est **Active**

### WhatsApp n'envoie pas
➡️ Vérifiez le format du numéro : `221778451234` (sans +, sans espaces)

### Email non reçu
➡️ Vérifiez les spams et les credentials Gmail OAuth2

### Image ne s'affiche pas
➡️ Vérifiez que l'upload Cloudinary a réussi dans les logs n8n

### Timeout
➡️ Réduisez la taille de l'image ou augmentez le timeout du fetch

---

## 📈 Métriques de Succès

**Objectifs à atteindre** :
- ⏱️ Temps d'envoi moyen : < 5 secondes
- ✅ Taux de succès : > 95%
- 📱 Taux de délivrabilité WhatsApp : > 98%
- 📧 Taux de délivrabilité Email : > 95%

**Monitoring** :
- Vérifiez les logs n8n quotidiennement
- Surveillez les erreurs dans Executions
- Demandez des retours aux premiers utilisateurs

---

## 🎉 Félicitations !

Une fois toutes ces étapes complétées, votre système d'envoi automatique de quittances est **100% opérationnel** !

**Prochaines étapes possibles** :
- Ajouter SMS comme canal de secours
- Implémenter des rappels de paiement automatiques
- Générer des rapports mensuels pour les propriétaires
- Intégrer des analytics sur les taux d'ouverture

---

## 📞 Support

**Documentation** :
- Guide complet : `docs/GUIDE-N8N-CONFIGURATION.md`
- Template WhatsApp : `docs/WHATSAPP-TEMPLATE-SUBMISSION.md`
- Script de test : `scripts/test-n8n-webhook.ts`

**Ressources externes** :
- n8n Community : https://community.n8n.io
- WhatsApp Business API : https://developers.facebook.com/docs/whatsapp
- Cloudinary Docs : https://cloudinary.com/documentation

**En cas de problème** :
1. Consultez les logs n8n (Executions)
2. Testez avec `npm run test:n8n`
3. Vérifiez chaque service individuellement
4. Consultez la section Troubleshooting ci-dessus

---

**Date de mise en production prévue** : _______
**Responsable** : _______
**Status** : ⬜ En cours / ✅ Terminé
