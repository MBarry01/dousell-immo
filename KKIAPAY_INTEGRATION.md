# KKiaPay Integration - Doussel Immo

## Vue d'ensemble

Cette intégration remplace PayDunya par KKiaPay pour offrir une **expérience de paiement sans redirection** (modal popup) conforme au Design System "Luxe & Teranga".

---

## ✨ Avantages de KKiaPay

| Critère | PayDunya (Ancien) | KKiaPay (Nouveau) |
|---------|-------------------|-------------------|
| **UX Paiement** | ❌ Redirection vers site externe | ✅ Modal popup sur place |
| **Canaux** | ✅ Wave + Orange Money | ✅ Wave + Orange Money |
| **Documentation** | ⚠️ PHP-centric, complexe | ✅ React-friendly, moderne |
| **DX (Developer Experience)** | ⚠️ API HTTP manuelle | ✅ SDK JavaScript officiel |
| **Temps d'intégration** | ~3 jours | ~2 heures |

---

## 📁 Architecture des Fichiers

### Nouveaux fichiers créés

```
lib/
└── kkiapay.ts                              # Config & utilitaires KKiaPay

components/payment/
└── KKiaPayWidget.tsx                       # Composant Widget modal

app/api/kkiapay/
├── confirm/
│   └── route.ts                            # Endpoint confirmation paiement
└── webhook/
    └── route.ts                            # Webhook serveur-à-serveur (optionnel)

app/(tenant)/portal/components/
├── RentPaymentModal.tsx                    # ✏️ Modifié (utilise KKiaPay)
└── PaymentForm.tsx                         # ✏️ Modifié (passe tenantEmail)

.env.local                                  # ✏️ Ajout clés KKiaPay
```

### Fichiers modifiés

1. **[.env.local](.env.local)** - Ajout configuration KKiaPay
2. **[RentPaymentModal.tsx](app/(tenant)/portal/components/RentPaymentModal.tsx)** - Remplacement PayDunya → KKiaPay
3. **[PaymentForm.tsx](app/(tenant)/portal/components/PaymentForm.tsx)** - Passage de `tenantEmail`
4. **[page.tsx](app/(tenant)/portal/page.tsx)** - Passage de `tenantEmail` au formulaire

---

## 🔐 Configuration des Variables d'Environnement

### Sandbox (Test)

```env
# KKiaPay Configuration (Sandbox)
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=595bb9c0e7f611f0837fadc53c00280f
KKIAPAY_PRIVATE_KEY=tpk_595c5600e7f611f0837fadc53c00280f
KKIAPAY_SECRET=tsk_595c5601e7f611f0837fadc53c00280f
KKIAPAY_MODE=sandbox
```

### Production

```env
# KKiaPay Configuration (Production)
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE_PRODUCTION
KKIAPAY_PRIVATE_KEY=VOTRE_CLE_PRIVEE_PRODUCTION
KKIAPAY_SECRET=VOTRE_SECRET_PRODUCTION
KKIAPAY_MODE=production
```

⚠️ **IMPORTANT** : Les clés de production seront différentes. Récupérez-les depuis le dashboard KKiaPay en mode Live.

---

## 🔄 Flow de Paiement

```
┌─────────────┐
│ Locataire   │
│ clique sur  │
│ "Payer"     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ RentPaymentModal s'ouvre │
│ avec KKiaPayWidget       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Utilisateur clique sur      │
│ bouton "Payer XXX FCFA"     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Script KKiaPay charge       │
│ Modal popup avec:           │
│ - Wave Sénégal              │
│ - Orange Money Sénégal      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Utilisateur saisit numéro   │
│ + code OTP sur son mobile   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ KKiaPay envoie événement    │
│ "success" au Widget         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Widget appelle              │
│ /api/kkiapay/confirm        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Serveur Next.js vérifie     │
│ transaction auprès de       │
│ KKiaPay API                 │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Si SUCCESS:                 │
│ 1. Maj Supabase (status paid)│
│ 2. Invalidation cache Redis │
│ 3. Envoi emails (locataire  │
│    + propriétaire)          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Toast "Paiement confirmé !" │
│ + Rafraîchissement page     │
└─────────────────────────────┘
```

---

## 🎨 Composant KKiaPayWidget

### Utilisation

```tsx
import KKiaPayWidget from '@/components/payment/KKiaPayWidget';

<KKiaPayWidget
  amount={150000}
  leaseId="xxxx-xxxx-xxxx"
  tenantName="Amadou Diallo"
  tenantEmail="amadou@example.com"
  periodMonth={1}
  periodYear={2026}
  onSuccess={(transactionId) => {
    toast.success("Paiement validé !");
  }}
  onError={(error) => {
    toast.error(`Erreur: ${error}`);
  }}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `amount` | `number` | Montant en FCFA (ex: 150000) |
| `leaseId` | `string` | ID du bail Supabase |
| `tenantName` | `string` | Nom complet du locataire |
| `tenantEmail` | `string` | Email du locataire |
| `periodMonth` | `number` | Mois (1-12) |
| `periodYear` | `number` | Année (ex: 2026) |
| `onSuccess` | `(transactionId: string) => void` | Callback succès |
| `onError` | `(error: string) => void` | Callback erreur |

---

## 🔧 API Routes

### POST /api/kkiapay/confirm

**Rôle** : Confirmer un paiement après réception de l'événement `success` du widget.

**Request Body** :
```json
{
  "transactionId": "kkiapay_txn_abc123",
  "leaseId": "xxxx-xxxx-xxxx",
  "periodMonth": 1,
  "periodYear": 2026
}
```

**Response** :
```json
{
  "success": true,
  "transactionId": "kkiapay_txn_abc123",
  "message": "Paiement confirmé avec succès"
}
```

**Actions effectuées** :
1. ✅ Vérification de la transaction auprès de KKiaPay (`GET /api/v1/transactions/{transactionId}`)
2. ✅ Mise à jour `rental_transactions` dans Supabase (`status = 'paid'`)
3. ✅ Invalidation du cache Redis (dashboard locataire + propriétaire)
4. ✅ Envoi d'emails de confirmation (locataire + propriétaire)

---

### POST /api/kkiapay/webhook

**Rôle** : Webhook serveur-à-serveur pour notifications asynchrones (optionnel).

**Configuration** : Dans le dashboard KKiaPay, configurer :
```
Webhook URL: https://doussel.immo/api/kkiapay/webhook
```

**Sécurité** : Validation de la signature HMAC-SHA256 avec `KKIAPAY_SECRET`.

---

## 🧪 Tests

### Test en Sandbox

1. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

2. **Se connecter comme locataire**
   - URL : `http://localhost:3000/portal`
   - Email : Celui configuré dans `leases.tenant_email`

3. **Cliquer sur "Payer maintenant"**
   - Modal KKiaPay s'ouvre
   - Choisir "Mobile Money"
   - Numéro test Sandbox : `+221770000000` (ou le numéro fourni par KKiaPay)
   - Code OTP test : `123456` (ou celui envoyé par SMS en sandbox)

4. **Vérifier les logs**
   ```
   ✅ Transaction KKiaPay validée: { transactionId: 'xxx', amount: 150000, status: 'SUCCESS' }
   ✅ Loyer payé via KKiaPay: Bail xxxx-xxxx-xxxx
   ✅ Cache invalidé: tenant_dashboard:email@example.com
   ✅ Email envoyé: Reçu de paiement - Loyer 1/2026
   ```

5. **Vérifier dans Supabase**
   - Table `rental_transactions` : `status = 'paid'`
   - Champ `payment_ref` contient le `transactionId` KKiaPay

---

## 🚀 Déploiement en Production

### Checklist

- [ ] **Récupérer les clés Production** depuis le dashboard KKiaPay
- [ ] **Mettre à jour `.env.production`**
  ```env
  KKIAPAY_MODE=production
  NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=pk_prod_xxxxxxxxx
  KKIAPAY_PRIVATE_KEY=sk_prod_xxxxxxxxx
  KKIAPAY_SECRET=secret_prod_xxxxxxxxx
  ```
- [ ] **Configurer le webhook KKiaPay**
  - URL : `https://doussel.immo/api/kkiapay/webhook`
  - Vérifier que l'URL est accessible publiquement
- [ ] **Tester un paiement réel** avec un petit montant (100 FCFA)
- [ ] **Vérifier les emails** de confirmation arrivent bien
- [ ] **Monitorer les logs Vercel** pour les erreurs

### Variables d'environnement Vercel

Ajouter dans Vercel Dashboard → Settings → Environment Variables :

```
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY = pk_prod_xxxxxxxxx
KKIAPAY_PRIVATE_KEY = sk_prod_xxxxxxxxx
KKIAPAY_SECRET = secret_prod_xxxxxxxxx
KKIAPAY_MODE = production
```

---

## 🔒 Sécurité

### Validation de la signature webhook

La fonction `validateKKiaPayWebhook()` utilise HMAC-SHA256 pour signer le payload avec `KKIAPAY_SECRET` :

```typescript
// lib/kkiapay.ts:98-115
export function validateKKiaPayWebhook(
  signature: string,
  payload: string
): boolean {
  const crypto = require("crypto");
  const config = getKKiaPayConfig();

  const expectedSignature = crypto
    .createHmac("sha256", config.secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
```

**Protection** :
- ✅ `timingSafeEqual` : Protection contre timing attacks
- ✅ Rejet immédiat si signature absente ou invalide
- ✅ Logs détaillés en cas d'échec

---

## 📊 Comparaison avec PayDunya

### Ce qui reste identique

- ✅ Invalidation du cache Redis (`invalidateRentalCaches`)
- ✅ Envoi d'emails de confirmation
- ✅ Mise à jour Supabase (`rental_transactions`)
- ✅ Design System "Luxe & Teranga"

### Ce qui change

| Aspect | PayDunya | KKiaPay |
|--------|----------|---------|
| **Redirection** | ❌ Oui (vers paydunya.com) | ✅ Non (modal popup) |
| **Script SDK** | ❌ Aucun (API HTTP pure) | ✅ `https://cdn.kkiapay.me/k.js` |
| **Validation** | SHA-512 de MasterKey | HMAC-SHA256 du payload |
| **Webhook** | `form-urlencoded` | `application/json` |
| **Confirmation** | Webhook uniquement | Widget callback + Webhook |

---

## 🐛 Troubleshooting

### Erreur : "Le système de paiement n'est pas encore chargé"

**Cause** : Le script KKiaPay n'a pas fini de charger.

**Solution** :
- Vérifier que `https://cdn.kkiapay.me/k.js` est accessible (pas bloqué par AdBlock)
- Rafraîchir la page
- Vérifier les logs console pour des erreurs de chargement

---

### Erreur : "Transaction non confirmée"

**Cause** : La transaction KKiaPay n'a pas le statut `SUCCESS`.

**Solution** :
- Vérifier dans le dashboard KKiaPay le statut de la transaction
- En sandbox, utiliser les numéros de test fournis par KKiaPay
- Vérifier que le montant est correct (minimum 100 FCFA)

---

### Webhook ne reçoit pas les notifications

**Cause** : L'URL du webhook est incorrecte ou inaccessible.

**Solution** :
- Vérifier dans le dashboard KKiaPay que l'URL est configurée
- Tester l'URL avec `curl` depuis l'extérieur
- En local, utiliser Ngrok : `ngrok http 3000`
  ```bash
  # Puis configurer dans KKiaPay
  https://abc123.ngrok.io/api/kkiapay/webhook
  ```

---

## 📚 Ressources

- **Documentation officielle KKiaPay** : https://docs.kkiapay.me/
- **Dashboard KKiaPay** : https://kkiapay.me/dashboard
- **Support KKiaPay** : support@kkiapay.me
- **Fichier lib** : [lib/kkiapay.ts](lib/kkiapay.ts)
- **Composant Widget** : [components/payment/KKiaPayWidget.tsx](components/payment/KKiaPayWidget.tsx)

---

## ✅ Statut de l'Intégration

- [x] Configuration des variables d'environnement
- [x] Création de `lib/kkiapay.ts`
- [x] Création du composant `KKiaPayWidget`
- [x] Création de l'API `/api/kkiapay/confirm`
- [x] Création du webhook `/api/kkiapay/webhook`
- [x] Modification de `RentPaymentModal`
- [x] Modification de `PaymentForm`
- [x] Documentation complète
- [ ] Tests en sandbox
- [ ] Tests en production (petit montant)
- [ ] Monitoring Sentry configuré

---

**Date** : 2 Janvier 2026
**Auteur** : Claude Code
**Version** : 1.0 - Migration PayDunya → KKiaPay
**Status** : ✅ Intégration complète - Tests en attente
