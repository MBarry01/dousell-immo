# Guide d'Intégration PayDunya - Dousell Immo

## 🎯 Vue d'ensemble

Ce document décrit l'intégration **production-ready** de PayDunya dans Dousell Immo, avec les bonnes pratiques "Lead Dev" :

- ✅ **Canaux Wave & Orange Money** uniquement (Sénégal)
- ✅ **Validation HMAC** sécurisée (protection timing attacks)
- ✅ **Verrous distribués** (Redlock) pour éviter les doubles paiements
- ✅ **Invalidation cache** automatique après webhook
- ✅ **Emails de confirmation** locataire + propriétaire

---

## 📦 Configuration Initiale

### 1. Variables d'environnement

Ajoutez ces variables dans `.env.local` (développement) et Vercel/serveur (production) :

```bash
# PayDunya API Keys (Sandbox)
PAYDUNYA_MASTER_KEY=votre_master_key_test
PAYDUNYA_PRIVATE_KEY=votre_private_key_test
PAYDUNYA_TOKEN=votre_token_test
PAYDUNYA_MODE=test

# PayDunya API Keys (Production)
# PAYDUNYA_MASTER_KEY=votre_master_key_live
# PAYDUNYA_PRIVATE_KEY=votre_private_key_live
# PAYDUNYA_TOKEN=votre_token_live
# PAYDUNYA_MODE=live

# URLs de callback
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Prod: https://dousell.sn
PAYDUNYA_CALLBACK_URL=https://votre-ngrok-url.ngrok.io/api/paydunya/webhook  # Dev only
# NGROK_CALLBACK_URL=https://...  # Alternative
```

### 2. Obtenir vos clés PayDunya

1. **Créer un compte** sur [PayDunya Dashboard](https://app.paydunya.com)
2. **Mode Test** : Utilisez les clés sandbox pour le développement
3. **Mode Live** : Contactez PayDunya pour activer votre compte marchand

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOCATAIRE clique "Payer" (/portal)                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SERVER ACTION (payments/actions.ts)                         │
│    - Verrou Redlock (10s) : payment:rent:{leaseId}            │
│    - Valide montant, bail, tenant                              │
│    - Appelle initializeRentalPayment()                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PAYDUNYA API (lib/paydunya.ts)                              │
│    - Force canaux: [wave-senegal, orange-money-senegal]       │
│    - Crée facture avec custom_data {lease_id, period_...}     │
│    - Retourne URL checkout PayDunya                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. REDIRECTION vers PayDunya                                   │
│    - Locataire choisit Wave ou Orange Money                    │
│    - Paie via mobile money                                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. WEBHOOK IPN (api/paydunya/webhook/route.ts)                │
│    - Parse application/x-www-form-urlencoded (clé 'data')     │
│    - Valide hash SHA-512 de MasterKey (crypto.timingSafeEqual)│
│    - Extrait custom_data {lease_id, period_month, ...}        │
│    - Update rental_transactions: status='paid'                 │
│    - Invalidation cache Redis (owner + tenant)                 │
│    - Envoie emails confirmation (locataire + proprio)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sécurité (Best Practices)

### 1. Validation du Hash SHA-512 du Webhook

**Code** : [lib/paydunya.ts:392](lib/paydunya.ts#L392)

```typescript
export function validatePayDunyaWebhook(receivedHash: string): boolean {
  const crypto = require("crypto");
  const config = getPayDunyaConfig();

  // PayDunya envoie un hash SHA-512 de la MasterKey (PAS HMAC!)
  const expectedHash = crypto
    .createHash("sha512")
    .update(config.masterKey)
    .digest("hex");

  // Protection contre les timing attacks
  if (receivedHash.length !== expectedHash.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}
```

**Pourquoi ?**
- ✅ **SHA-512** (pas HMAC) du **MasterKey** selon la doc officielle PayDunya
- ✅ `timingSafeEqual` empêche les timing attacks (comparaison constante)
- ✅ Le hash est envoyé dans le payload (pas en header)

### 1.1 Format du Webhook PayDunya

**Important** : PayDunya envoie les webhooks en `application/x-www-form-urlencoded`, PAS en JSON !

**Code** : [app/api/paydunya/webhook/route.ts:11](app/api/paydunya/webhook/route.ts#L11)

```typescript
// ❌ FAUX : await request.json()
// ✅ CORRECT :
const formData = await request.formData();
const dataString = formData.get('data') as string;
const payload = JSON.parse(dataString); // Le JSON est dans la clé 'data'
```

**Structure reçue** :
```
POST /api/paydunya/webhook
Content-Type: application/x-www-form-urlencoded

data={"response_code":"00","hash":"abc123...","invoice":{...},"customer":{...}}
```

### 2. Verrous Distribués (Redlock)

**Code** : [app/(tenant)/portal/payments/actions.ts:8](app/(tenant)/portal/payments/actions.ts#L8)

```typescript
export async function processRentalPayment(leaseId: string) {
  return withLock(`payment:rent:${leaseId}`, async () => {
    // Logique de paiement ici
  }, {
    ttl: 10000,      // Lock pendant 10s
    retryCount: 0    // Refuse immédiatement si déjà verrouillé
  });
}
```

**Pourquoi ?**
- Empêche le double-clic utilisateur → doubles paiements
- Lock expire automatiquement après 10s
- Fonctionne en mode distribué (multi-instances Vercel)

### 3. Canaux de Paiement Restreints

**Code** : [lib/paydunya.ts:307](lib/paydunya.ts#L307)

```typescript
const payload = {
  invoice: {
    channels: ['wave-senegal', 'orange-money-senegal']  // ← Force uniquement ces 2
  }
};
```

**Pourquoi ?**
- Élimine les méthodes non supportées (cartes bancaires, etc.)
- Évite confusion utilisateur
- Réduit frais transactions (Mobile Money < CB)

---

## 💾 Invalidation du Cache

### Clés de cache invalidées après paiement

**Code** : [app/api/paydunya/webhook/route.ts:80-95](app/api/paydunya/webhook/route.ts#L80)

```typescript
// Invalider côté PROPRIÉTAIRE
await invalidateRentalCaches(lease.owner_id, customData.lease_id, {
  invalidateLeases: true,        // Liste des baux
  invalidateTransactions: true,  // Historique paiements
  invalidateStats: true,         // KPIs financiers
});

// Invalider côté LOCATAIRE
await invalidateCacheBatch([
  `tenant_dashboard:${lease.tenant_email}`,  // Dashboard principal
  `tenant_payments:${customData.lease_id}`,  // Historique locataire
], 'rentals');
```

**Résultat** :
- Dashboard proprio = rafraîchi (KPIs à jour)
- Dashboard locataire = statut "Payé" immédiat

---

## 📧 Emails de Confirmation

### Template Locataire

**Code** : [app/api/paydunya/webhook/route.ts:92-99](app/api/paydunya/webhook/route.ts#L92)

```typescript
await sendEmail({
  to: lease.tenant_email,
  subject: `Reçu de paiement - Loyer ${periodMonth}/${periodYear}`,
  html: `
    <h1>Paiement reçu !</h1>
    <p>Bonjour ${lease.tenant_name},</p>
    <p>Votre paiement de <strong>${amount} FCFA</strong> a été confirmé.</p>
    <p>Votre quittance est disponible dans votre espace locataire.</p>
  `
});
```

### Template Propriétaire

```typescript
await sendEmail({
  to: lease.owner.email,
  subject: `[Paiement] Loyer reçu - ${lease.tenant_name}`,
  html: `Le locataire ${lease.tenant_name} a réglé ${amount} FCFA via PayDunya.`
});
```

---

## 🧪 Tests en Local (avec ngrok)

### Problème
PayDunya ne peut pas envoyer de webhook vers `localhost:3000`

### Solution
Utilisez **ngrok** pour exposer votre serveur local :

```bash
# 1. Installer ngrok
npm install -g ngrok

# 2. Lancer votre app Next.js
npm run dev

# 3. Exposer le port 3000 (dans un autre terminal)
ngrok http 3000

# 4. Copier l'URL publique (ex: https://abc123.ngrok.io)
# 5. Mettre à jour .env.local
PAYDUNYA_CALLBACK_URL=https://abc123.ngrok.io/api/paydunya/webhook
```

### Tester le webhook

1. Créer un paiement test
2. Payer avec les credentials test PayDunya
3. Vérifier les logs dans votre terminal Next.js :

```
✅ Loyer payé via PayDunya: Bail xxxx-xxxx-xxxx
```

---

## 🚀 Déploiement en Production

### Checklist

- [ ] Passer `PAYDUNYA_MODE=live`
- [ ] Utiliser les clés **LIVE** (master, private, token)
- [ ] Configurer `NEXT_PUBLIC_APP_URL=https://dousell.sn`
- [ ] Retirer `PAYDUNYA_CALLBACK_URL` (utilisera automatiquement `${NEXT_PUBLIC_APP_URL}/api/paydunya/webhook`)
- [ ] Vérifier que Redis/Valkey est actif en prod (cache + locks)
- [ ] Tester un paiement réel avec petit montant

### Vérifications Post-Déploiement

```bash
# 1. Vérifier que le webhook est accessible
curl https://dousell.sn/api/paydunya/webhook

# 2. Vérifier les logs Vercel pour "Webhook PayDunya reçu:"

# 3. Tester un vrai paiement de 100 FCFA
```

---

## 🔧 Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| `lib/paydunya.ts` | ✅ Ajout `channels: ['wave-senegal', 'orange-money-senegal']` |
| `app/(tenant)/portal/payments/actions.ts` | ✅ Ajout `withLock()` (Redlock) |
| `app/api/paydunya/webhook/route.ts` | ✅ Invalidation cache Redis après paiement |
| `.env.local` | ✅ Configuration complète PayDunya |

---

## 📚 Ressources

- **Documentation PayDunya** : https://developers.paydunya.com/doc/FR/http_json
- **Canaux disponibles** : [Liste officielle](https://developers.paydunya.com/doc/FR/channels)
- **Statuts webhook** : `completed`, `pending`, `cancelled`
- **Support** : support@paydunya.com

---

## 📊 Statuts de Paiement

PayDunya renvoie 4 statuts possibles dans les webhooks :

| Statut | Description | Action Dousell |
|--------|-------------|----------------|
| `completed` | ✅ Paiement réussi | Marquer `rental_transactions.status = 'paid'`, envoyer emails |
| `pending` | ⏳ En cours de traitement | Logger, attendre webhook final (peut durer 24h max) |
| `cancelled` | ⚠️ Annulé par l'utilisateur | Logger, notifier utilisateur (optionnel) |
| `failed` | ❌ Échec du paiement | Logger avec `fail_reason` et `errors`, notifier utilisateur |

**Champs supplémentaires pour échecs** :
- `fail_reason` : "Payment cancelled by customer", "Insufficient funds", etc.
- `errors.message` et `errors.description` : Détails pour cartes bancaires

**Code** : [app/api/paydunya/webhook/route.ts:172-192](app/api/paydunya/webhook/route.ts#L172)

---

## ⚠️ Notes Importantes

1. **Sandbox vs Live** : Ne mélangez JAMAIS les clés test et prod
2. **Hash SHA-512** : Si invalide, le webhook est rejeté (401)
3. **Format Webhook** : `application/x-www-form-urlencoded` avec clé `data` (PAS du JSON direct)
4. **Callback URL** : Doit être HTTPS en production (pas de HTTP)
5. **TTL Cache** : Dashboard locataire = 2 min, Transactions = 1 min
6. **Verrou Redlock** : Expire après 10s automatiquement
7. **Pending → Auto-cancel** : Un paiement `pending` peut s'auto-annuler après 24h

---

**Dernière mise à jour** : Janvier 2026 (Corrections critiques webhook)
**Auteur** : Équipe Dousell Immo
**Version** : 1.1 (Production Ready - Webhook Format Fixed)
