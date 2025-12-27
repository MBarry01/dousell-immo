# 📡 Exemples API - Webhook n8n Baraka Immo

## 🎯 Vue d'ensemble

Ce document contient tous les exemples de payloads, réponses et cas d'usage pour tester et debugger le webhook n8n.

---

## 📤 Payload Complet (Cas Nominal)

### Request

**URL** : `https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow`
**Method** : `POST`
**Content-Type** : `application/json`

```json
{
  "body": {
    "tenantName": "Amadou Diallo",
    "tenantPhone": "0778451234",
    "tenantEmail": "amadou.diallo@example.com",
    "propertyAddress": "Villa Almadies, Lot 45, Dakar",
    "monthPeriod": "Janvier 2025",
    "amount": 350000,
    "receiptNumber": "BARAKA-2025-001",
    "ownerName": "Fatou Seck",
    "receiptImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}
```

### Response (Succès)

**Status** : `200 OK`

```json
{
  "success": true,
  "message": "Quittance envoyée avec succès",
  "sentTo": {
    "whatsapp": "221778451234",
    "email": "amadou.diallo@example.com"
  },
  "receipt": {
    "number": "BARAKA-2025-001",
    "tenant": "Amadou Diallo",
    "amount": "350 000 FCFA",
    "period": "Janvier 2025"
  },
  "timestamp": "2025-12-26T10:30:45.123Z"
}
```

---

## 📱 Cas d'Usage : WhatsApp Uniquement

### Request

```json
{
  "body": {
    "tenantName": "Mariama Ba",
    "tenantPhone": "0770123456",
    "tenantEmail": null,
    "propertyAddress": "Appartement Mermoz, Dakar",
    "monthPeriod": "Février 2025",
    "amount": 250000,
    "receiptNumber": "BARAKA-2025-002",
    "ownerName": "Moussa Ndiaye",
    "receiptImage": "data:image/png;base64,..."
  }
}
```

### Response

```json
{
  "success": true,
  "message": "Quittance envoyée avec succès",
  "sentTo": {
    "whatsapp": "221770123456",
    "email": null
  },
  "receipt": {
    "number": "BARAKA-2025-002",
    "tenant": "Mariama Ba",
    "amount": "250 000 FCFA",
    "period": "Février 2025"
  },
  "timestamp": "2025-12-26T10:35:12.456Z"
}
```

---

## 📧 Cas d'Usage : Email Uniquement

### Request

```json
{
  "body": {
    "tenantName": "Jean-Pierre Dubois",
    "tenantPhone": "",
    "tenantEmail": "jp.dubois@email.fr",
    "propertyAddress": "Studio Plateau, Abidjan",
    "monthPeriod": "Mars 2025",
    "amount": 180000,
    "receiptNumber": "BARAKA-2025-003",
    "ownerName": "Aissata Koné",
    "receiptImage": "data:image/png;base64,..."
  }
}
```

### Response

```json
{
  "success": true,
  "message": "Quittance envoyée avec succès",
  "sentTo": {
    "whatsapp": null,
    "email": "jp.dubois@email.fr"
  },
  "receipt": {
    "number": "BARAKA-2025-003",
    "tenant": "Jean-Pierre Dubois",
    "amount": "180 000 FCFA",
    "period": "Mars 2025"
  },
  "timestamp": "2025-12-26T10:40:33.789Z"
}
```

---

## ❌ Erreur : Données Manquantes

### Request (Invalid)

```json
{
  "body": {
    "tenantName": "Test User",
    "tenantPhone": "",
    "tenantEmail": "",
    "receiptImage": ""
  }
}
```

### Response

**Status** : `400 Bad Request`

```json
{
  "success": false,
  "message": "Données invalides",
  "error": "Le numéro de téléphone et l'image de la quittance sont requis",
  "timestamp": "2025-12-26T10:45:00.000Z"
}
```

---

## 🔐 Avec Authentification (Sécurisé)

### Request

**Headers** :
```http
POST /webhook/auto-receipt-flow HTTP/1.1
Content-Type: application/json
X-Webhook-Secret: votre-cle-secrete-32-caracteres
```

**Body** :
```json
{
  "body": {
    "tenantName": "Secure Test",
    "tenantPhone": "0776543210",
    "tenantEmail": "secure@test.com",
    "propertyAddress": "Test Address",
    "monthPeriod": "Avril 2025",
    "amount": 400000,
    "receiptNumber": "BARAKA-2025-004",
    "ownerName": "Owner Name",
    "receiptImage": "data:image/png;base64,..."
  }
}
```

### Response (Secret Correct)

**Status** : `200 OK`
```json
{
  "success": true,
  "message": "Quittance envoyée avec succès",
  ...
}
```

### Response (Secret Incorrect)

**Status** : `401 Unauthorized`
```json
{
  "success": false,
  "error": "Unauthorized",
  "timestamp": "2025-12-26T10:50:00.000Z"
}
```

---

## 🧪 Tests avec curl

### Test Basique

```bash
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "tenantName": "Test Curl",
      "tenantPhone": "0771234567",
      "tenantEmail": "test@curl.com",
      "propertyAddress": "Test Property",
      "monthPeriod": "Test Month",
      "amount": 100000,
      "receiptNumber": "TEST-001",
      "ownerName": "Test Owner",
      "receiptImage": "data:image/png;base64,iVBORw0KGgo="
    }
  }'
```

### Test avec Authentification

```bash
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: votre-cle-secrete" \
  -d @payload.json
```

### Test avec Timeout

```bash
curl -X POST https://votre-id.app.n8n.cloud/webhook/auto-receipt-flow \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --max-time 30 \
  -v
```

---

## 🧪 Tests avec JavaScript/TypeScript

### Test avec Fetch

```typescript
const payload = {
  body: {
    tenantName: "Test User",
    tenantPhone: "0778451234",
    tenantEmail: "test@example.com",
    propertyAddress: "Test Address",
    monthPeriod: "Mai 2025",
    amount: 300000,
    receiptNumber: "TEST-005",
    ownerName: "Test Owner",
    receiptImage: "data:image/png;base64,..."
  }
};

const response = await fetch(process.env.NEXT_PUBLIC_N8N_URL!, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log(result);
```

### Test avec Axios

```typescript
import axios from 'axios';

const response = await axios.post(
  process.env.NEXT_PUBLIC_N8N_URL!,
  {
    body: {
      tenantName: "Test Axios",
      tenantPhone: "0771234567",
      tenantEmail: "axios@test.com",
      propertyAddress: "Test Property",
      monthPeriod: "Juin 2025",
      amount: 275000,
      receiptNumber: "TEST-006",
      ownerName: "Test Owner",
      receiptImage: "data:image/png;base64,..."
    }
  },
  {
    headers: {
      'Content-Type': 'application/json',
    }
  }
);

console.log(response.data);
```

---

## 📊 Format des Données

### Types TypeScript

```typescript
interface ReceiptPayload {
  body: {
    tenantName: string;          // Nom complet du locataire
    tenantPhone: string;          // Format: "0778451234" ou "+221778451234"
    tenantEmail: string | null;   // Email valide ou null
    propertyAddress: string;      // Adresse complète de la propriété
    monthPeriod: string;          // Ex: "Janvier 2025", "Jan 2025", etc.
    amount: number;               // Montant en FCFA (integer)
    receiptNumber: string;        // Format: "BARAKA-YYYY-XXX"
    ownerName: string;            // Nom du propriétaire
    receiptImage: string;         // Base64 data URI: "data:image/png;base64,..."
  };
}

interface ReceiptResponse {
  success: boolean;
  message: string;
  sentTo?: {
    whatsapp: string | null;
    email: string | null;
  };
  receipt?: {
    number: string;
    tenant: string;
    amount: string;  // Formaté: "350 000 FCFA"
    period: string;
  };
  timestamp: string;  // ISO 8601
  error?: string;
}
```

### Validation Zod

```typescript
import { z } from 'zod';

const ReceiptPayloadSchema = z.object({
  body: z.object({
    tenantName: z.string().min(2, "Nom trop court"),
    tenantPhone: z.string().regex(/^(\+221)?[0-9]{9}$/, "Format téléphone invalide"),
    tenantEmail: z.string().email("Email invalide").nullable(),
    propertyAddress: z.string().min(5, "Adresse trop courte"),
    monthPeriod: z.string().min(3, "Période invalide"),
    amount: z.number().int().positive("Montant invalide"),
    receiptNumber: z.string().regex(/^BARAKA-\d{4}-\d{3}$/, "Format numéro invalide"),
    ownerName: z.string().min(2, "Nom propriétaire trop court"),
    receiptImage: z.string().startsWith("data:image/", "Image invalide"),
  })
});
```

---

## 🔍 Débogage

### Vérifier le Payload dans n8n

Dans le nœud **"Parse Receipt Data"**, ajoutez :

```javascript
// Log du payload reçu
console.log('Payload reçu:', JSON.stringify($input.first().json, null, 2));

// Vérifier chaque champ
const data = $input.first().json.body;
console.log('Tenant Phone:', data.tenantPhone);
console.log('Email:', data.tenantEmail);
console.log('Image size:', data.receiptImage.length);

return { json: data };
```

### Logs dans les Executions n8n

1. Menu → **Executions**
2. Cliquez sur une exécution
3. Pour chaque nœud :
   - ✅ Vert = Succès
   - ❌ Rouge = Erreur
4. Cliquez sur un nœud pour voir :
   - Input data
   - Output data
   - Error details

---

## 📈 Cas de Test Recommandés

### Checklist de Tests

- [ ] **Test 1** : Payload complet (WhatsApp + Email)
- [ ] **Test 2** : WhatsApp uniquement (email = null)
- [ ] **Test 3** : Email uniquement (phone = "")
- [ ] **Test 4** : Téléphone format international (+221...)
- [ ] **Test 5** : Téléphone format local (077...)
- [ ] **Test 6** : Montant = 0 (edge case)
- [ ] **Test 7** : Montant très grand (> 1M FCFA)
- [ ] **Test 8** : Caractères spéciaux dans nom
- [ ] **Test 9** : Adresse très longue
- [ ] **Test 10** : Image très volumineuse (> 1MB)
- [ ] **Test 11** : Données manquantes (erreur 400)
- [ ] **Test 12** : Avec authentification
- [ ] **Test 13** : Sans authentification (si configurée)
- [ ] **Test 14** : Timeout (réseau lent simulé)
- [ ] **Test 15** : 10 envois simultanés (charge)

---

## 🎨 Exemples d'Images Base64

### Image 1x1 (minimal, pour tests rapides)

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

### Image de Test 100x100

```typescript
// Générer avec Canvas
import { createCanvas } from 'canvas';

const canvas = createCanvas(100, 100);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#F4C430';
ctx.fillRect(0, 0, 100, 100);
ctx.fillStyle = '#000';
ctx.font = 'bold 20px Arial';
ctx.fillText('TEST', 10, 50);

const base64 = canvas.toDataURL('image/png');
console.log(base64);
```

---

## 💡 Bonnes Pratiques

### 1. Taille de l'Image

**Recommandé** : 800x1000px, < 500KB
**Max** : 2000x2500px, < 2MB

```typescript
// Compression avant envoi
const compressedImage = await compressImage(receiptImage, {
  maxWidth: 800,
  maxHeight: 1000,
  quality: 0.85
});
```

### 2. Timeout

**Frontend** :
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeout);
}
```

### 3. Retry sur Erreur

```typescript
async function sendWithRetry(payload: ReceiptPayload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { /* ... */ });
      if (response.ok) return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 4. Feedback Utilisateur

```typescript
try {
  setStatus('sending');
  const result = await sendReceipt(payload);

  if (result.success) {
    toast.success(`Quittance envoyée à ${result.sentTo.whatsapp || result.sentTo.email}`);
  }
} catch (error) {
  toast.error('Erreur lors de l\'envoi. Réessayez.');
} finally {
  setStatus('idle');
}
```

---

## 📞 Support

Pour toute question sur les payloads ou les réponses :
1. Consultez les logs n8n (Executions)
2. Testez avec `npm run test:n8n`
3. Vérifiez les types TypeScript
4. Consultez le guide principal : `GUIDE-N8N-CONFIGURATION.md`

---

**🎯 Tous les exemples sont prêts à être utilisés pour vos tests !**
