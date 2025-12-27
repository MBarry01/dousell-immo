# 🔧 Guide de Dépannage Rapide - n8n Baraka Immo

## 🎯 Diagnostic Express (30 secondes)

```bash
# 1. Tester la connexion au webhook
npm run test:n8n

# 2. Si erreur, vérifier les logs n8n
# Allez sur: https://votre-id.app.n8n.cloud → Executions

# 3. Vérifier la configuration
cat .env.local | grep N8N
```

---

## ❌ Problèmes Fréquents et Solutions

### 1. "Webhook ne répond pas (404 Not Found)"

**Symptômes** :
```
Error: fetch failed
Status: 404 Not Found
```

**Causes possibles** :
- ⚠️ Workflow n8n est inactif
- ⚠️ URL du webhook incorrecte
- ⚠️ Workflow supprimé

**Solutions** :

✅ **Vérifier que le workflow est actif** :
1. Allez sur n8n
2. Ouvrez le workflow "Baraka Immo - Auto Receipt Flow"
3. Toggle en haut à droite doit être **VERT** (Active)

✅ **Vérifier l'URL** :
1. Dans le nœud "Webhook Trigger", cliquez sur "Copy Test URL"
2. Comparez avec `NEXT_PUBLIC_N8N_URL` dans `.env.local`
3. Doivent être identiques

✅ **Recréer le webhook** :
1. Désactivez le workflow
2. Réactivez-le
3. Copiez la nouvelle URL
4. Mettez à jour `.env.local`

---

### 2. "WhatsApp ne reçoit pas le message"

**Symptômes** :
- n8n montre succès
- Mais pas de message WhatsApp reçu

**Causes possibles** :
- ⚠️ Numéro mal formaté
- ⚠️ Token WhatsApp expiré
- ⚠️ Quota dépassé
- ⚠️ Numéro bloqué

**Solutions** :

✅ **Vérifier le format du numéro** :
```javascript
// ❌ MAUVAIS
"0778451234"
"+221 77 845 12 34"
"77 845 12 34"

// ✅ BON
"221778451234"
```

Dans le nœud "Parse Receipt Data" de n8n, vérifiez :
```javascript
whatsappPhone: data.tenantPhone.replace(/\s/g, '').replace(/^0/, '221')
```

✅ **Vérifier le token WhatsApp** :
1. Allez sur https://developers.facebook.com
2. Votre app → WhatsApp → Configuration
3. Générez un nouveau token si expiré
4. Mettez à jour `WHATSAPP_TOKEN` dans n8n

✅ **Vérifier le quota** :
1. WhatsApp Business Manager → Insights
2. Vérifiez les limites d'envoi
3. Si dépassé, attendez 24h

✅ **Tester avec un autre numéro** :
```bash
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "tenantPhone": "VOTRE_NUMERO_TEST",
      ...
    }
  }'
```

---

### 3. "Email non reçu"

**Symptômes** :
- n8n montre succès
- Pas d'email dans la boîte de réception

**Causes possibles** :
- ⚠️ Email dans les spams
- ⚠️ Credentials Gmail expirées
- ⚠️ Email invalide
- ⚠️ Quota Gmail dépassé

**Solutions** :

✅ **Vérifier les spams** :
1. Ouvrez Gmail
2. Dossier "Spam" ou "Promotions"
3. Si présent, marquez comme "Non spam"

✅ **Vérifier les credentials** :
1. n8n → Credentials → Gmail OAuth2
2. Cliquez sur "Reconnect"
3. Suivez le processus OAuth

✅ **Vérifier l'adresse email** :
```javascript
// Dans n8n, nœud "Send Email"
console.log('Email destinataire:', $json.tenantEmail);

// Doit être un email valide
// ✅ "test@example.com"
// ❌ "test" ou null ou undefined
```

✅ **Tester l'envoi manuel** :
1. Dans n8n, ouvrez le nœud "Send Email"
2. Cliquez sur "Execute Node"
3. Vérifiez les logs

---

### 4. "Image ne s'affiche pas dans WhatsApp/Email"

**Symptômes** :
- Message reçu
- Mais image manquante ou cassée

**Causes possibles** :
- ⚠️ Upload Cloudinary échoué
- ⚠️ URL de l'image inaccessible
- ⚠️ Image trop volumineuse
- ⚠️ Format base64 corrompu

**Solutions** :

✅ **Vérifier l'upload Cloudinary** :
1. n8n → Executions → Dernière exécution
2. Cliquez sur le nœud "Upload to Cloudinary"
3. Vérifiez la réponse :
```json
{
  "secure_url": "https://res.cloudinary.com/...",
  "public_id": "receipt_BARAKA-2025-001"
}
```

✅ **Tester l'URL manuellement** :
1. Copiez `secure_url` depuis les logs
2. Ouvrez dans un navigateur
3. L'image doit s'afficher

✅ **Vérifier les credentials Cloudinary** :
1. n8n → Settings → Environments
2. `CLOUDINARY_CLOUD_NAME` correct ?
3. `CLOUDINARY_UPLOAD_PRESET` existe et est "unsigned" ?

✅ **Réduire la taille de l'image** :
Dans `ReceiptModal.tsx` :
```typescript
// Avant conversion en base64
const compressedCanvas = compressImage(canvas, { quality: 0.8 });
```

---

### 5. "Timeout / Request too long"

**Symptômes** :
```
Error: Request timeout
Error: The operation was aborted
```

**Causes possibles** :
- ⚠️ Image trop volumineuse
- ⚠️ n8n surchargé
- ⚠️ Réseau lent

**Solutions** :

✅ **Augmenter le timeout** :
Dans `ReceiptModal.tsx` :
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s au lieu de 15s

try {
  const response = await fetch(url, {
    signal: controller.signal,
    ...
  });
} finally {
  clearTimeout(timeout);
}
```

✅ **Compresser l'image** :
```typescript
// Réduire la qualité
const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // JPEG 70% au lieu de PNG
```

✅ **Vérifier la taille de l'image** :
```typescript
const sizeInKB = (dataUrl.length * 3) / 4 / 1024;
console.log('Image size:', sizeInKB, 'KB');

if (sizeInKB > 1000) {
  alert('Image trop volumineuse, réduction en cours...');
  // Compresser davantage
}
```

---

### 6. "Erreur 400 - Données invalides"

**Symptômes** :
```json
{
  "success": false,
  "error": "Le numéro de téléphone et l'image de la quittance sont requis"
}
```

**Causes** :
- ⚠️ `tenantPhone` vide ou null
- ⚠️ `receiptImage` vide ou null

**Solutions** :

✅ **Vérifier le payload avant envoi** :
Dans `ReceiptModal.tsx` :
```typescript
const payload = {
  tenantName: lease.tenant.name,
  tenantPhone: lease.tenant.phone || '',
  tenantEmail: lease.tenant.email || null,
  receiptImage: receiptDataUrl,
  // ...
};

console.log('Payload à envoyer:', payload);

// Validation
if (!payload.tenantPhone || !payload.receiptImage) {
  toast.error('Données incomplètes');
  return;
}
```

✅ **Vérifier la validation n8n** :
Dans le nœud "Validate Data" :
```javascript
// Debug
console.log('tenantPhone:', $json.body.tenantPhone);
console.log('receiptImage:', $json.body.receiptImage?.substring(0, 50));
```

---

### 7. "Erreur 401 - Unauthorized"

**Symptômes** :
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Cause** :
- ⚠️ Webhook secret incorrect ou manquant

**Solutions** :

✅ **Vérifier le secret** :
Dans `.env.local` :
```env
N8N_WEBHOOK_SECRET=votre-cle-secrete
```

Dans `ReceiptModal.tsx` :
```typescript
headers: {
  'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
}
```

Dans n8n (nœud "Validate Data") :
```javascript
const secret = $input.first().json.headers['x-webhook-secret'];
const expectedSecret = '{{$env.N8N_WEBHOOK_SECRET}}';

console.log('Secret reçu:', secret);
console.log('Secret attendu:', expectedSecret);

if (secret !== expectedSecret) {
  throw new Error('Unauthorized');
}
```

✅ **Désactiver temporairement** :
Pour tester, commentez la validation dans n8n :
```javascript
// if (secret !== expectedSecret) {
//   throw new Error('Unauthorized');
// }
```

---

### 8. "n8n Executions montrent des erreurs"

**Symptômes** :
- Nœuds en rouge dans n8n
- Erreurs dans les logs

**Solutions par type d'erreur** :

#### A. Erreur sur "Upload to Cloudinary"

```
Error: 401 Unauthorized / Invalid credentials
```

✅ **Solution** :
1. Vérifiez `CLOUDINARY_CLOUD_NAME`
2. Vérifiez que l'upload preset existe et est "unsigned"
3. Testez manuellement :
```bash
curl -X POST https://api.cloudinary.com/v1_1/VOTRE_CLOUD_NAME/image/upload \
  -F "file=data:image/png;base64,..." \
  -F "upload_preset=baraka-immo-receipts"
```

#### B. Erreur sur "Send WhatsApp"

```
Error: (#100) The parameter recipient_phone_number is required
Error: Invalid phone number
```

✅ **Solution** :
Vérifiez le format du numéro dans le payload du nœud :
```json
{
  "to": "{{$json.whatsappPhone}}"  // Doit être "221778451234"
}
```

#### C. Erreur sur "Send Email"

```
Error: Invalid grant / Token expired
```

✅ **Solution** :
1. Credentials → Gmail OAuth2 → Reconnect
2. Réautorisez l'accès Gmail

---

## 🧪 Checklist de Diagnostic Complète

Suivez cette checklist dans l'ordre :

### Niveau 1 : Configuration de base

- [ ] `NEXT_PUBLIC_N8N_URL` configurée dans `.env.local`
- [ ] URL correcte (copiée depuis n8n)
- [ ] Workflow n8n **Active** (toggle vert)
- [ ] Variables d'environnement n8n configurées
- [ ] Credentials Gmail configurées

### Niveau 2 : Test de connectivité

- [ ] `npm run test:n8n` réussit
- [ ] Webhook répond 200 (pas 404)
- [ ] Pas de timeout
- [ ] Réponse JSON valide

### Niveau 3 : Test des services

- [ ] Upload Cloudinary réussit (logs n8n)
- [ ] WhatsApp API répond 200
- [ ] Gmail API répond 200
- [ ] Image accessible via URL Cloudinary

### Niveau 4 : Livraison

- [ ] Message WhatsApp reçu
- [ ] Email reçu (vérifier spams)
- [ ] Images affichées correctement
- [ ] Pas de messages d'erreur

---

## 🔍 Commandes de Debug Utiles

### Tester le webhook avec curl

```bash
# Test minimal
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -d '{"body":{"tenantPhone":"0778451234","receiptImage":"test"}}'

# Test complet
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -d @test-payload.json \
  -v  # Verbose pour voir les headers
```

### Vérifier les variables d'environnement

```bash
# Next.js
cat .env.local | grep N8N

# Vérifier qu'elle est chargée
npm run dev
# Puis dans le code: console.log(process.env.NEXT_PUBLIC_N8N_URL)
```

### Générer une image de test

```typescript
// Dans le navigateur (Console DevTools)
const canvas = document.createElement('canvas');
canvas.width = 100;
canvas.height = 100;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 100, 100);
const dataUrl = canvas.toDataURL();
console.log(dataUrl);  // Copier ceci
```

### Vérifier la taille du payload

```typescript
const payload = { /* ... */ };
const size = new Blob([JSON.stringify(payload)]).size;
console.log('Payload size:', size, 'bytes');
// Si > 1MB, c'est probablement trop volumineux
```

---

## 📞 Obtenir de l'Aide

### 1. Logs n8n (toujours commencer ici)

```
https://votre-id.app.n8n.cloud/executions
```

- Regardez la dernière exécution
- Nœud rouge = problème
- Cliquez dessus pour voir l'erreur exacte

### 2. Logs Frontend

```typescript
// Dans ReceiptModal.tsx, ajoutez:
console.log('Sending to n8n:', payload);
console.log('Response:', await response.json());
```

### 3. Support n8n

- Community: https://community.n8n.io
- Documentation: https://docs.n8n.io
- Discord: https://discord.gg/n8n

### 4. Support Services Tiers

**WhatsApp Business API** :
- https://developers.facebook.com/support
- Vérifiez le status : https://developers.facebook.com/status/

**Cloudinary** :
- https://support.cloudinary.com
- Status : https://status.cloudinary.com

**Gmail API** :
- https://support.google.com/a
- Status : https://www.google.com/appsstatus

---

## 🚨 Cas d'Urgence

### Le système est complètement cassé

**Plan B : Désactiver n8n temporairement**

Dans `ReceiptModal.tsx` :
```typescript
const handleSend = async () => {
  // TEMPORAIRE : Bypass n8n
  toast.info('Envoi manuel requis - n8n désactivé temporairement');

  // Option 1 : Télécharger l'image
  const link = document.createElement('a');
  link.download = `quittance-${receiptNumber}.png`;
  link.href = receiptDataUrl;
  link.click();

  // Option 2 : Copier dans le presse-papier
  navigator.clipboard.writeText(receiptDataUrl);
  toast.success('Image copiée - envoyez manuellement via WhatsApp Web');

  return;

  // Le code n8n original reste commenté ci-dessous
  // const response = await fetch(...)
};
```

### Migration d'urgence vers un autre service

Si n8n est down de façon prolongée, alternatives :

**Option 1 : Zapier**
- Plus cher mais plus stable
- Interface similaire
- Migration rapide

**Option 2 : Make (Integromat)**
- Prix compétitif
- Interface visuelle
- Migration moyennement rapide

**Option 3 : Backend Next.js**
- Créer une API route `/api/send-receipt`
- Appeler directement WhatsApp + Gmail APIs
- Plus de contrôle, mais plus de code

---

## ✅ Validation Post-Fix

Après avoir résolu un problème, validez que tout fonctionne :

```bash
# 1. Test automatique
npm run test:n8n

# 2. Test depuis l'app
# Générez et envoyez une quittance de test

# 3. Vérifiez la réception
# WhatsApp + Email

# 4. Vérifiez les logs n8n
# Tous les nœuds verts ✅

# 5. Vérifiez les métriques
# Temps d'exécution < 10s
# Pas d'erreurs dans les 10 dernières exécutions
```

---

## 📚 Ressources de Dépannage

- **Guide complet** : [GUIDE-N8N-CONFIGURATION.md](./GUIDE-N8N-CONFIGURATION.md)
- **Exemples API** : [EXAMPLES-API-N8N.md](./EXAMPLES-API-N8N.md)
- **Workflow visuel** : [VISUAL-WORKFLOW-N8N.md](./VISUAL-WORKFLOW-N8N.md)
- **Plan d'action** : [PLAN-ACTION-N8N.md](./PLAN-ACTION-N8N.md)

---

**🔧 La plupart des problèmes se résolvent en 5-10 minutes avec ce guide !**
