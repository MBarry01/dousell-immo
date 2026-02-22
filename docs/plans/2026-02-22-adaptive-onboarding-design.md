# Onboarding Adaptatif — Design Document

**Date**: 2026-02-22
**Statut**: Approuvé
**Scope**: Expérience d'activation in-dashboard `/gestion` (post-inscription)

---

## Contexte

Le WizardForm existant (`/pro/start`) gère l'inscription et la création de l'agence (branding, équipe). Il ne guide pas l'utilisateur à travers la configuration locative réelle. Résultat : beaucoup d'utilisateurs créent leur compte mais ne configurent jamais leur premier bien/locataire/bail.

**Objectif** : Guider l'utilisateur jusqu'à sa première quittance générée, en détectant automatiquement son état réel.

---

## Architecture

### Approche retenue : Banner + Stepper persistant

- `ActivationBanner` collapsible dans le layout `/gestion`
- Stage calculé server-side à chaque chargement (toujours exact)
- Chaque étape redirige vers les pages existantes (0 duplication de forms)
- Disparaît définitivement après `activation_completed_at` set en DB

### Pourquoi pas les alternatives

| Alternative | Rejet |
|-------------|-------|
| Modal multi-step inline | Triple la complexité, duplique les forms existants |
| Redirect URL param | State fragile, expérience hachée, reprise impossible proprement |

---

## Data Model

### Migration requise

```sql
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS activation_completed_at TIMESTAMPTZ DEFAULT NULL;
```

### Calcul du stage (live, jamais stocké)

```typescript
type ActivationStage = 1 | 2 | 3 | 4

// Stage 1: 0 biens
// Stage 2: ≥1 bien, 0 locataires
// Stage 3: ≥1 locataire, 0 baux actifs
// Stage 4: ≥1 bail actif → activation complète

async function getActivationStage(teamId: string): Promise<{
  stage: ActivationStage
  completedAt: Date | null
}>
```

**Règle** : si `activation_completed_at` est non-null, la banner ne s'affiche plus jamais — indépendamment du stage calculé.

---

## Composants

### Arborescence

```
components/activation/
├── ActivationBanner.tsx      — Banner principale (Client Component)
├── ActivationStepper.tsx     — Stepper 3 étapes avec état visuel
├── ActivationStep.tsx        — Une étape individuelle (done/active/pending)
└── ActivationCompleteCTA.tsx — CTA "Générer votre première quittance"

lib/activation/
└── get-activation-stage.ts   — Server-side stage calculation

app/(workspace)/gestion/layout.tsx
└── Injecte stage + completedAt → ActivationGuard → children
```

### ActivationBanner — état expanded

```
┌─────────────────────────────────────────────────────┐
│  Activez votre gestion locative          [Réduire ↑] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━░░░░░  1/3                 │
│                                                     │
│  ✓  Compte créé                                     │
│  →  Ajouter un bien              [Commencer →]      │
│  ○  Ajouter un locataire                            │
│  ○  Configurer un bail                              │
└─────────────────────────────────────────────────────┘
```

### ActivationBanner — état collapsed

```
[▶ Activer gestion — 1/3]
```

Persiste en `localStorage('activation-banner-collapsed')`.

### ActivationCompleteCTA (affiché une fois, stage 4 détecté)

```
┌─────────────────────────────────────────┐
│  🎉 Votre gestion locative est activée  │
│                                         │
│  [ Générer un contrat ]                 │
│  [ Générer une quittance ]              │
│                                  [✕]   │
└─────────────────────────────────────────┘
```

Après fermeture : `completeActivation(teamId)` → `activation_completed_at = NOW()` → banner disparaît définitivement.

---

## Soft-lock modules

Pas de blocage réel de navigation. Sur les modules sensibles (Comptabilité, États des lieux, Juridique) :

- **Badge** dans la nav : `🔒 Requiert un bail`
- **InlineNotice** en haut de la page si accès direct :

```
Pour utiliser la Comptabilité,
configurez d'abord un bail.
[ Configurer maintenant → ]
```

### Matrice de soft-lock

| Module | Condition pour accès complet |
|--------|------------------------------|
| Biens | Toujours accessible |
| Locataires | Stage ≥ 2 (≥1 bien) |
| Documents | Toujours accessible |
| Messagerie | Toujours accessible |
| Comptabilité | Stage ≥ 4 (≥1 bail actif) |
| États des lieux | Stage ≥ 3 (≥1 locataire) |
| Interventions | Stage ≥ 3 (≥1 locataire) |
| Juridique | Stage ≥ 4 (≥1 bail actif) |
| Équipe | Toujours accessible |
| Configuration | Toujours accessible |

---

## State Management

### Fetching

Server Component dans `gestion/layout.tsx`. Aucun state client pour le stage.

### Invalidation

Les Server Actions existantes (ajout bien, locataire, bail) font déjà `revalidatePath`. Le layout se recharge → stage recalculé automatiquement → banner mise à jour. Aucune synchronisation supplémentaire.

### Collapse state

`useLocalStorage('activation-banner-collapsed', false)` — Client Component uniquement.

---

## Flow complet

```
Inscription /pro/start
       ↓
/gestion (stage calculé)
       ↓
Stage 1: Banner affichée → [Commencer] → /gestion/biens/nouveau
       ↓ (bien créé, revalidatePath)
Stage 2: Banner mise à jour → /gestion/locataires/nouveau
       ↓ (locataire créé)
Stage 3: Banner mise à jour → /gestion/baux/nouveau
       ↓ (bail créé)
Stage 4: ActivationCompleteCTA affiché
       ↓ (user clique ✕ ou CTA)
completeActivation() → activation_completed_at = NOW()
       ↓
Banner disparaît définitivement
Dashboard plein accès
```

---

## Out of scope

- Tracking analytics des étapes (peut être ajouté post-MVP)
- Onboarding Team (plusieurs membres) — géré séparément
- Adaptation du message selon porte d'entrée (bonus post-MVP)
- Tests E2E (ajoutés après implémentation)
