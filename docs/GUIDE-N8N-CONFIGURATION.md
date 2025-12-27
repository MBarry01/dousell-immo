# 📘 Guide de Configuration n8n - Baraka Immo

## 🎯 Objectif
Automatiser l'envoi de quittances de loyer via WhatsApp et Email depuis votre application Baraka Immo.

---

## 📋 Prérequis

### 1. Compte n8n
- **n8n Cloud** (recommandé) : https://n8n.io/cloud
- **n8n Self-hosted** : https://docs.n8n.io/hosting/

### 2. Services externes requis

#### A. WhatsApp Business API
**Option 1 : WhatsApp Business Platform (Meta)**
- Compte Facebook Business Manager
- WhatsApp Business Account
- Numéro de téléphone dédié
- API Token et Phone Number ID
- 📖 Guide : https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

**Option 2 : Services tiers (plus simple)**
- **Twilio WhatsApp** : https://www.twilio.com/whatsapp
- **MessageBird** : https://messagebird.com
- **360dialog** : https://www.360dialog.com

#### B. Cloudinary (stockage d'images)
- Compte gratuit : https://cloudinary.com
- Cloud Name
- Upload Preset (unsigned)

#### C. Gmail API
- Compte Gmail Business ou personnel
- OAuth2 activé pour n8n

---

## 🚀 Installation du Workflow

### Étape 1 : Importer le workflow dans n8n

1. **Connexion à n8n**
   ```
   https://votre-instance.app.n8n.cloud
   ```

2. **Importer le fichier**
   - Cliquez sur le menu (☰) en haut à gauche
   - Sélectionnez **"Import from File"**
   - Uploadez le fichier `n8n-workflow-auto-receipt.json`

3. **Vérifier l'importation**
   - Le workflow "Baraka Immo - Auto Receipt Flow" apparaît
   - Tous les nœuds sont visibles sur le canvas

---

### Étape 2 : Configurer les variables d'environnement

Dans n8n, allez dans **Settings → Environments** et ajoutez :

```env
# WhatsApp Business API
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_PHONE_ID=123456789012345

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_UPLOAD_PRESET=votre-preset
```

#### Comment obtenir ces valeurs :

**WhatsApp Business API (Meta) :**
1. Allez sur https://developers.facebook.com
2. Créez une app "Business"
3. Ajoutez le produit "WhatsApp"
4. Dans **Configuration** :
   - Copiez le **Phone Number ID**
   - Générez un **Access Token**

**Cloudinary :**
1. Allez sur https://cloudinary.com/console
2. Dashboard → **Cloud Name** (en haut)
3. Settings → Upload → **Upload Presets**
4. Créez un preset **"unsigned"** nommé `baraka-immo-receipts`

---

### Étape 3 : Configurer les credentials

#### A. Gmail OAuth2

1. Dans n8n, allez dans **Credentials → New**
2. Sélectionnez **"Gmail OAuth2"**
3. Suivez l'assistant de connexion Google
4. Autorisez les permissions d'envoi d'emails
5. Nommez les credentials : `Gmail Account`

#### B. WhatsApp API (si nœud natif utilisé)

1. Credentials → New → **"WhatsApp Business Account"**
2. Entrez :
   - Access Token : `{{$env.WHATSAPP_TOKEN}}`
   - Phone Number ID : `{{$env.WHATSAPP_PHONE_ID}}`

---

### Étape 4 : Activer le webhook

1. **Ouvrir le nœud "Webhook Trigger"**
2. Cliquez sur **"Listen for Test Event"**
3. **Copiez l'URL du webhook** générée
   ```
   https://votre-instance.app.n8n.cloud/webhook/auto-receipt-flow
   ```
4. Collez cette URL dans votre `.env.local` :
   ```env
   NEXT_PUBLIC_N8N_URL="https://votre-instance.app.n8n.cloud/webhook/auto-receipt-flow"
   ```

5. **Activer le workflow**
   - Toggle en haut à droite → **Active**
   - Le webhook est maintenant en écoute permanente

---

## 🧪 Test du Workflow

### Test manuel depuis n8n

1. Dans le nœud **"Webhook Trigger"**, cliquez sur **"Execute Node"**
2. Utilisez ce payload de test :

```json
{
  "body": {
    "tenantName": "Amadou Diallo",
    "tenantPhone": "0778451234",
    "tenantEmail": "amadou@example.com",
    "propertyAddress": "Villa Almadies, Dakar",
    "monthPeriod": "Janvier 2025",
    "amount": 350000,
    "receiptNumber": "BARAKA-2025-001",
    "ownerName": "Fatou Seck",
    "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}
```

3. Cliquez sur **"Execute Workflow"**
4. Vérifiez que tous les nœuds deviennent verts ✅

### Test depuis votre application

1. Redémarrez votre application Next.js :
   ```bash
   npm run dev
   ```

2. Allez dans **Gestion Locative**
3. Générez une quittance de loyer
4. Cliquez sur **"Envoyer"**
5. Vérifiez :
   - ✅ Réponse de succès dans l'application
   - 📱 Message WhatsApp reçu
   - 📧 Email reçu
   - 🖼️ Image visible dans les deux canaux

---

## 🔧 Configuration Avancée

### Option 1 : Utiliser un Template WhatsApp pré-approuvé

Si vous avez un compte WhatsApp Business vérifié, vous pouvez utiliser des templates :

1. **Créer le template dans Meta Business Manager**
   - Nom : `quittance_loyer`
   - Langue : Français
   - Catégorie : Utility
   - Header : Image
   - Body :
     ```
     Bonjour {{1}},

     Votre quittance de loyer pour {{2}} est disponible.

     💰 Montant : {{3}}
     🏠 Propriété : {{4}}
     📝 N° : {{5}}

     ✅ Paiement confirmé
     Merci pour votre ponctualité !
     ```

2. **Dans n8n, activez le nœud "Send WhatsApp (Template)"**
3. **Désactivez "Send WhatsApp (Direct)"**

### Option 2 : Notifications supplémentaires

Ajoutez un nœud **Slack** ou **Discord** pour notifier le propriétaire :

```javascript
// Nœud Code après "Log Success"
return {
  json: {
    text: `✅ Quittance envoyée à ${$json.tenantName}\n💰 ${$json.formattedAmount}\n📋 ${$json.receiptNumber}`
  }
};
```

### Option 3 : Stockage en base de données

Ajoutez un nœud **Supabase** pour enregistrer l'historique d'envoi :

```javascript
// Insert into "receipt_logs" table
{
  tenant_id: $json.tenantId,
  receipt_number: $json.receiptNumber,
  sent_via: ['whatsapp', 'email'],
  sent_at: new Date().toISOString(),
  status: 'delivered'
}
```

---

## 🛡️ Sécurité

### Authentification du webhook (recommandé)

1. Ajoutez une clé secrète dans `.env.local` :
   ```env
   N8N_WEBHOOK_SECRET=votre-cle-secrete-aleatoire
   ```

2. Dans le nœud **"Validate Data"**, ajoutez :
   ```javascript
   // Vérifier le header X-Webhook-Secret
   const secret = $input.first().json.headers['x-webhook-secret'];
   if (secret !== '{{$env.N8N_WEBHOOK_SECRET}}') {
     throw new Error('Unauthorized');
   }
   ```

3. Dans votre application, modifiez `ReceiptModal.tsx` :
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
   }
   ```

---

## 📊 Monitoring

### Logs dans n8n

1. **Executions** (menu de gauche) affiche :
   - ✅ Succès (vert)
   - ❌ Erreurs (rouge)
   - ⏱️ Temps d'exécution

2. **Cliquez sur une exécution** pour voir le détail :
   - Données reçues
   - Transformations
   - Messages envoyés

### Alertes

Configurez un nœud **Error Trigger** :
- Notifie par email en cas d'échec
- Alerte sur Slack/Discord

---

## ❓ Troubleshooting

### Le webhook ne répond pas
✅ **Solution** :
- Vérifiez que le workflow est **Active**
- Testez l'URL avec curl :
  ```bash
  curl -X POST https://votre-instance.app.n8n.cloud/webhook/auto-receipt-flow \
    -H "Content-Type: application/json" \
    -d '{"body":{"tenantPhone":"0778451234","receiptImage":"test"}}'
  ```

### WhatsApp ne reçoit pas le message
✅ **Vérifications** :
- Le numéro est au format international : `221778451234`
- Le token WhatsApp est valide
- Le quota d'envoi n'est pas dépassé

### Email non reçu
✅ **Vérifications** :
- Credentials Gmail configurées
- Vérifiez les spams
- Logs Gmail API dans n8n

### Image ne s'affiche pas
✅ **Vérifications** :
- Upload Cloudinary a réussi
- URL de l'image est publique
- Format base64 correct dans le payload

---

## 💡 Optimisations

### 1. Rate Limiting
Ajoutez un nœud **"Wait"** pour éviter les limites API :
```javascript
// Attendre 1 seconde entre chaque envoi
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 2. Retry Logic
En cas d'échec, réessayer 3 fois avec délai exponentiel :
- 1ère tentative : immédiate
- 2ème tentative : +5 secondes
- 3ème tentative : +15 secondes

### 3. Fallback SMS
Si WhatsApp échoue, envoyer un SMS via Twilio

---

## 📞 Support

- **n8n Community** : https://community.n8n.io
- **WhatsApp Business API** : https://developers.facebook.com/support
- **Documentation Cloudinary** : https://cloudinary.com/documentation

---

## 🎉 Résultat Final

Une fois configuré, le système :

1. ✅ Reçoit la quittance depuis Baraka Immo
2. ✅ Valide les données
3. ✅ Upload l'image sur Cloudinary
4. ✅ Envoie par WhatsApp avec message formaté
5. ✅ Envoie par Email avec template HTML premium
6. ✅ Retourne une confirmation à l'application
7. ✅ Log l'activité pour audit

**Temps d'exécution moyen** : 3-5 secondes
**Taux de succès visé** : >99%

---

**🚀 Prêt à générer et envoyer vos quittances automatiquement !**
