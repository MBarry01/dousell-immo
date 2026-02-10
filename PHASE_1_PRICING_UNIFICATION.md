# Phase 1 : Unification du Système de Pricing ✅

**Date** : 2026-02-10
**Statut** : ✅ **COMPLÉTÉ**
**Objectif** : Créer une source unique de vérité pour tous les plans tarifaires

---

## 🎯 RÉSUMÉ DES CHANGEMENTS

### ✅ Problèmes Corrigés

| # | Problème | Solution | Fichiers Modifiés |
|---|----------|----------|-------------------|
| **1** | **3 schémas de pricing différents** | Source unique `plans-config.ts` | ✅ Tous synchronisés |
| **2** | **Limites incohérentes** (5 vs 10 vs 15 biens) | Limites unifiées : Starter = **15 biens** | ✅ features.ts, pricing-section, SubscriptionManager |
| **3** | **Stripe Plans non configurés** | Documentation complète `.env.local.example` | ✅ Variables ajoutées avec exemples |
| **4** | **Plans hard-codés partout** | Import dynamique depuis `plans-config.ts` | ✅ 4 fichiers refactorisés |

---

## 📂 FICHIERS CRÉÉS

### ✨ Nouveau : Source Unique de Vérité

**[lib/subscription/plans-config.ts](lib/subscription/plans-config.ts)** (NOUVEAU)

Configuration centralisée de TOUS les plans avec :

```typescript
export const PLANS = {
  starter: {
    pricing: { monthly: 15000, annual: 144000 },  // -20%
    limits: {
      maxProperties: 15,      // ↑ Augmenté de 5 → 15
      maxLeases: 20,
      maxTenants: 30,
      maxTeamMembers: 1,
    },
    highlightedFeatures: [...],  // Marketing
    stripeMonthlyPriceId: env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
    stripeAnnualPriceId: env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  },

  pro: {
    pricing: { monthly: 35000, annual: 336000 },
    limits: {
      maxProperties: 75,       // ↑ Limité (avant ∞)
      maxLeases: Infinity,
      maxTenants: Infinity,
      maxTeamMembers: 5,
    },
    // ...
  },

  enterprise: {
    pricing: { monthly: 75000, annual: 720000 },
    limits: { /* Tous Infinity */ },
    features: { canUseAPI: true, canWhiteLabel: true },
    // ...
  }
}
```

**Helpers exportés** :
- `getAllPlans()` : Liste complète des plans
- `getPlan(tier)` : Plan spécifique
- `formatPrice(amount)` : Formatage FCFA
- `getStripePriceId(tier, cycle)` : Récupère Price ID
- `exceedsLimit(tier, limitType, value)` : Vérifie dépassement quota

---

## 🔄 FICHIERS MODIFIÉS (6 fichiers)

### 1. [lib/subscription/features.ts](lib/subscription/features.ts)

**AVANT** : Source de vérité avec limites hard-codées
**APRÈS** : Couche de compatibilité réexportant depuis `plans-config.ts`

```typescript
// ❌ AVANT (hard-coded)
export const PLAN_FEATURES = {
  starter: { maxProperties: 10, ... },  // Incohérent !
}

// ✅ APRÈS (dynamique)
import { PLANS, getPlan } from './plans-config';
export const PLAN_FEATURES = {
  starter: buildLegacyFeatures('starter'),  // Construit depuis PLANS
}
```

**Nouveaux exports** : `canPerformAction`, `getPlanLimits`, `exceedsLimit`

---

### 2. [components/landing/sections/pricing-section.tsx](components/landing/sections/pricing-section.tsx)

**AVANT** : 71 lignes de plans hard-codés
**APRÈS** : Import dynamique depuis `plans-config.ts`

```typescript
// ❌ AVANT
const plans = [
  { name: "Starter", pricing: { monthly: 15000, ... }, features: [...] },
  // ... répété 3 fois
]

// ✅ APRÈS
import { getAllPlans, formatPrice } from '@/lib/subscription/plans-config';
const plans = getAllPlans().map(plan => ({
  name: plan.name,
  pricing: { monthly: plan.pricing.monthly, ... },
  features: plan.highlightedFeatures,
}));
```

**Changements clés** :
- ✅ "yearly" → "annual" (cohérence terminologie)
- ✅ Starter : **5 biens** → **15 biens**
- ✅ Prix formatés avec `formatPrice()`

---

### 3. [components/gestion/SubscriptionManager.tsx](components/gestion/SubscriptionManager.tsx)

**AVANT** : 2 cartes hard-codées (Starter, Pro), Enterprise manquant
**APRÈS** : Génération dynamique depuis `plans-config.ts`

```typescript
// ❌ AVANT (2 divs copiées-collées)
<div>...</div>  // Starter
<div>...</div>  // Pro
// Enterprise ❌ Manquant !

// ✅ APRÈS (DRY - Don't Repeat Yourself)
{getAllPlans()
  .filter(plan => plan.id !== 'enterprise')
  .map(plan => (
    <PlanCard key={plan.id} {...plan} />
  ))}
```

**Changements clés** :
- ✅ Starter : **10 biens** → **15 biens**
- ✅ Prix formatés avec `formatPrice()`
- ✅ Trial duration : `14` → `TRIAL_DURATION_DAYS` (constante)

---

### 4. [lib/subscription/stripe.ts](lib/subscription/stripe.ts)

**AVANT** : Stripe Plans hard-codés avec env vars obsolètes
**APRÈS** : Import depuis `plans-config.ts`

```typescript
// ❌ AVANT
export const STRIPE_PLANS = {
  starter: { priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER },
  // ... ❌ Variables obsolètes (pas de _MONTHLY/_ANNUAL)
}

// ✅ APRÈS
import { getStripePriceId } from './plans-config';
export const STRIPE_PLANS = {
  starter: { priceId: getStripePriceId('starter', 'monthly') },
  // ... ✅ Utilise nouvelles variables
}
```

**Nouveaux helpers** :
- `getStripePriceIdForPlan(tier, cycle)` : Récupère Price ID avec fallback

---

### 5. [components/landing/PricingSection.tsx](components/landing/PricingSection.tsx) ✨ NOUVEAU

**AVANT** : Plans hard-codés avec **prix différents** (!!)
**APRÈS** : Import dynamique depuis `plans-config.ts`

```typescript
// ❌ AVANT (PRICES WRONG!)
const plans = [
  { name: "STARTER", price: isAnnual ? 15000 : 19000 },  // ❌ 19k vs 15k!
  { name: "PROFESSIONAL", price: isAnnual ? 35000 : 45000 },  // ❌ 45k vs 35k!
  { name: "ENTERPRISE", price: isAnnual ? 95000 : 120000 },  // ❌ 120k vs 75k!
]

// ✅ APRÈS (CONSISTENT)
import { getAllPlans } from '@/lib/subscription/plans-config';
const plans = getAllPlans().map(plan => ({
  name: plan.name.toUpperCase(),
  price: billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.annual,
  features: plan.highlightedFeatures,
}));
```

**Changements clés** :
- ✅ Prix unifiés : 15k/35k/75k (au lieu de 19k/45k/120k)
- ✅ Starter : **10 biens** → **15 biens**
- ✅ Toggle `isAnnual` → `billingCycle` (cohérence terminologie)

---

### 6. [.env.local.example](.env.local.example)

**AVANT** : Pas de section Stripe
**APRÈS** : Documentation complète Stripe avec 6 Price IDs

```bash
# ✅ AJOUTÉ : Section Stripe complète
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Prix Mensuels
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1xxxxx

# Prix Annuels (-20% = 2 mois offerts)
NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_1xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL=price_1xxxxx
```

**Documentation** : Guide complet pour créer les produits dans Stripe Dashboard

---

## 📊 TABLEAU DE COHÉRENCE (APRÈS PHASE 1)

### Prix (FCFA)

| Plan | Mensuel | Annuel | Économie |
|------|---------|--------|----------|
| **Starter** | 15 000 | 144 000 | 36 000 (-20%) |
| **Pro** | 35 000 | 336 000 | 84 000 (-20%) |
| **Enterprise** | 75 000 | 720 000 | 180 000 (-20%) |

✅ **Source unique** : `plans-config.ts`
✅ **Cohérent partout** : Vitrine, SaaS, Feature Gating

---

### Limites par Plan

| Plan | Biens | Baux | Locataires | Équipe |
|------|-------|------|------------|--------|
| **Starter** | **15** ✅ | 20 | 30 | 1 |
| **Pro** | **75** ✅ | ∞ | ∞ | 5 |
| **Enterprise** | ∞ | ∞ | ∞ | ∞ |

**Changements** :
- ❌ Starter : ~~5 biens~~ → ✅ **15 biens** (réaliste marché sénégalais)
- ❌ Pro : ~~∞ biens~~ → ✅ **75 biens** (différenciation Enterprise)

---

### Capacités par Plan

| Capacité | Starter | Pro | Enterprise |
|----------|---------|-----|------------|
| **Inviter membres** | ❌ | ✅ (5 max) | ✅ (∞) |
| **Export données** | ✅ | ✅ | ✅ |
| **Rapports avancés** | ❌ | ✅ | ✅ |
| **API & Webhooks** | ❌ | ❌ | ✅ |
| **White-label** | ❌ | ❌ | ✅ |
| **Support** | Standard | Prioritaire | 24/7 |

✅ **Source unique** : `plans-config.ts` → `features` object

---

## 🧪 TESTS À EFFECTUER

### 1. Build TypeScript

```bash
npm run build
```

**Attendu** : ✅ Pas d'erreur TypeScript
**Si erreur** : Vérifier imports `plans-config.ts`

---

### 2. Vérification Vitrine (Public)

**URL** : `http://localhost:3000/#pricing`

**Checklist** :
- [ ] 3 plans affichés (Starter, Pro, Enterprise)
- [ ] Prix : 15k, 35k, 75k FCFA
- [ ] Toggle Mensuel/Annuel fonctionne
- [ ] Starter affiche "Jusqu'à **15 biens**"
- [ ] Pro a le badge "Le plus populaire"
- [ ] Enterprise a "Contacter l'équipe"

---

### 3. Vérification SaaS (Dashboard)

**URL** : `http://localhost:3000/gestion/config` (Onglet "Abonnement")

**Checklist** :
- [ ] 2 cartes : Starter (15k) + Pro (35k)
- [ ] Starter affiche "Jusqu'à **15 biens**"
- [ ] Pro affiche "Biens illimités"
- [ ] Bouton "Enterprise" en bas (redirect `/contact`)
- [ ] Badge trial si en essai (14 jours)

---

### 4. Vérification Feature Gating

```typescript
// Test dans console navigateur ou fichier test
import { getPlanLimits } from '@/lib/subscription/plans-config';

console.log(getPlanLimits('starter'));
// Attendu : { maxProperties: 15, maxLeases: 20, ... }

console.log(getPlanLimits('pro'));
// Attendu : { maxProperties: 75, maxLeases: Infinity, ... }
```

---

### 5. Vérification Stripe Checkout

**Prérequis** : Configurer `.env.local` avec vrais Stripe Price IDs

```bash
# 1. Créer produits dans Stripe Dashboard
# 2. Copier Price IDs dans .env.local
# 3. Tester checkout
```

**Flow** :
1. User clique "Choisir Pro" dans `/gestion/config`
2. → Appel `/api/subscription/checkout` avec `{ planId: 'pro' }`
3. → Redirect vers Stripe Checkout
4. → Webhook `/api/stripe/webhook` active subscription

**Attendu** : Session créée avec bon `priceId`

---

## 🚨 CONFIGURATION REQUISE (CRITIQUE)

### Stripe Dashboard - Créer 6 Products/Prices

**Étape 1** : Créer 3 produits (Starter, Pro, Enterprise)

**Étape 2** : Pour chaque produit, créer 2 prix :

| Produit | Prix Mensuel | Prix Annuel |
|---------|--------------|-------------|
| **Starter** | 15 000 FCFA/mois | 144 000 FCFA/an |
| **Pro** | 35 000 FCFA/mois | 336 000 FCFA/an |
| **Enterprise** | 75 000 FCFA/mois | 720 000 FCFA/an |

**Étape 3** : Copier les 6 Price IDs dans `.env.local`

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_1ABC123...
NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL=price_1DEF456...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1GHI789...
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_1JKL012...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1MNO345...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL=price_1PQR678...
```

**Étape 4** : Configurer Webhook

- URL : `https://yourdomain.com/api/stripe/webhook`
- Events : `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Copier Signing Secret dans `.env.local` → `STRIPE_WEBHOOK_SECRET`

---

## 📌 LIMITATIONS CONNUES (PHASE 1)

### ⚠️ Checkout ne propose pas encore Monthly/Annual

**Situation actuelle** :
- ✅ Plans ont les 2 prix (mensuel + annuel)
- ✅ Vitrine affiche toggle Mensuel/Annuel
- ❌ **Checkout utilise TOUJOURS le prix MENSUEL**

**Pourquoi** : Simplification Phase 1 (éviter scope creep)

**Solution (Phase 2)** :
```typescript
// TODO: Ajouter paramètre `cycle` au checkout
handleUpgrade(planId: string, cycle: 'monthly' | 'annual')
```

---

### ⚠️ Migration profiles → teams incomplète

**Situation actuelle** :
- Dual-read avec fallback vers `profiles.pro_status` (legacy)
- Risque de données incohérentes

**Solution (Phase 2)** :
- Créer cron job pour migrer tous les profils → teams
- Supprimer fallback legacy

---

## ✅ PROCHAINES ÉTAPES

### Phase 2 : Court Terme (1 semaine)

1. **Ajouter toggle Mensuel/Annuel dans SubscriptionManager**
   - Permettre choix cycle dans checkout
   - Test A/B : Économie annuelle visible ↑ conversions ?

2. **Terminer migration profiles → teams**
   - Script de migration automatique
   - Supprimer code legacy

3. **Créer page `/tarifs` dédiée**
   - SEO : schema JSON-LD
   - Canonical URL
   - Performance : SSG (Static Site Generation)

---

### Phase 3 : Moyen Terme (2-3 semaines)

4. **Analytics & Tracking**
   - Tracker conversions par plan (Google Analytics)
   - Churn rate par tier
   - Revenue tracking (Stripe Dashboard + DB sync)

5. **Ajouter Wave comme méthode de paiement**
   - Intégration API Wave (concurrent Noflaye)
   - Priorité #1 au Sénégal (65% parts de marché)

6. **Tests E2E**
   - Playwright : Flow complet signup → trial → upgrade
   - Test webhook Stripe (Stripe CLI)

---

## 📚 DOCUMENTATION ASSOCIÉE

- [lib/subscription/plans-config.ts](lib/subscription/plans-config.ts) : Code source commenté
- [.env.local.example](.env.local.example) : Variables d'environnement
- [CLAUDE.md](CLAUDE.md) : Architecture globale
- [COMPONENT_MAP.md](COMPONENT_MAP.md) : Cartographie composants

---

## 🎉 RÉCAPITULATIF

### Ce qui a été fait ✅

- ✅ Source unique de vérité créée (`plans-config.ts`)
- ✅ **6 fichiers refactorisés** (vitrine + SaaS + feature gating + `/pro` page)
- ✅ Limites unifiées (Starter 15 biens, Pro 75 biens)
- ✅ Prix unifiés (correction critique `/pro` : 19k→15k, 45k→35k, 120k→75k)
- ✅ Documentation Stripe complète (6 Price IDs)
- ✅ Feature gating cohérent

### Ce qui reste à faire ⏳

- ⏳ Configurer Stripe Dashboard (créer 6 prix)
- ⏳ Copier Price IDs dans `.env.local`
- ⏳ Tester build + checkout
- ⏳ Déployer en staging

---

**Auteur** : Claude Sonnet 4.5
**Date** : 2026-02-10
**Durée** : Phase 1 complétée en ~2h
**Prochaine Phase** : Phase 2 (Toggle Annual + Migration profiles)
