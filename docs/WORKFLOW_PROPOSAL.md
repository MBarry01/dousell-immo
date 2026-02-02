# Proposition de Workflow Utilisateur - Dousell Immo

> **Date**: 31 Janvier 2026
> **Status**: Proposition pour validation
> **Version**: 1.6 (Aligné avec CLAUDE.md & rental_management_workflow)

---

## 0. Contexte & Règles d'Implémentation

> **IMPORTANT** : Ce document doit être lu ET implémenté en respectant les règles existantes du projet.

### 0.1 Documents de Référence (Source de Vérité)

| Document | Rôle | Lien |
|----------|------|------|
| **CLAUDE.md** | Règles de développement, stack, patterns | `/CLAUDE.md` |
| **rental_management_workflow** | Architecture Gestion Locative (Owner > Property > Lease) | Skill `/rental_management_workflow` |
| **Ce document** | Workflow utilisateur et parcours | `/docs/WORKFLOW_PROPOSAL.md` |

### 0.2 Règles CLAUDE.md à Respecter

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RÈGLES CLAUDE.md APPLICABLES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🔴 REUSE FIRST                                                           │
│   ──────────────                                                            │
│   → Chercher les composants/utils existants AVANT de créer                 │
│   → Utiliser grep/find pour trouver du code similaire                      │
│   → Si création nécessaire, documenter POURQUOI                            │
│                                                                             │
│   🔴 MINIMAL CHANGES                                                       │
│   ──────────────────                                                        │
│   → Préférer refactor-in-place plutôt que réécriture                      │
│   → Un changement = un commit                                              │
│   → Pas de scope creep                                                     │
│                                                                             │
│   🔴 TEAM-AWARENESS                                                        │
│   ───────────────────                                                       │
│   → Vérifier si action pour individual ou team_id                          │
│   → Prioriser branding Team/Agency sur contracts                           │
│                                                                             │
│   🔴 SECURITY BY DESIGN                                                    │
│   ────────────────────────                                                  │
│   → Validation Zod pour tous les Server Actions                            │
│   → RLS = barrière finale de sécurité                                     │
│   → Vérifier getCurrentUser() + roles avant actions sensibles              │
│                                                                             │
│   🔴 FRENCH-FIRST UX                                                       │
│   ────────────────────                                                      │
│   → Labels et messages en français                                         │
│   → Prix en centimes (integer)                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 0.3 Alignement avec rental_management_workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              COHÉRENCE AVEC RENTAL_MANAGEMENT_WORKFLOW                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ARCHITECTURE PROPRIÉTAIRE-CENTRIC (CONFIRMÉE)                           │
│   ─────────────────────────────────────────────                             │
│                                                                             │
│   Owner (auth.user)                                                        │
│      └── Property (properties)                                             │
│             └── Lease (leases) ← contient infos locataire                 │
│                    └── Tenant Access Token (nouveau)                       │
│                                                                             │
│   ✅ Le locataire N'EST PAS un auth.user (confirmé)                        │
│   ✅ Infos locataire dans leases, pas table tenants séparée (existant)    │
│   ✅ Magic Link pour accès /locataire (nouveau)                            │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────  │
│                                                                             │
│   TABLES EXISTANTES À RÉUTILISER                                           │
│   ──────────────────────────────                                            │
│                                                                             │
│   • profiles         → company_address, full_name, logo_url, signature_url │
│   • properties       → title, location (JSONB), description                │
│   • leases           → tenant_*, start_date, end_date, rent_amount         │
│   • team_members     → user_id, team_id, role                              │
│   • teams            → owner_id, name, settings                            │
│                                                                             │
│   ⚠️ NE PAS CRÉER de table `tenants` séparée                              │
│   ⚠️ Utiliser les champs tenant_* existants dans leases                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 0.4 Audit de l'Existant (Avant Implémentation)

> **Règle** : Avant chaque tâche, exécuter cet audit pour éviter les doublons.

```typescript
// Checklist d'audit avant implémentation
const AUDIT_CHECKLIST = {
  // 1. Routes existantes
  "routes": [
    "app/(vitrine)/",           // Marketplace publique ✅
    "app/(workspace)/gestion/", // Dashboard gestion ✅
    "app/(webapp)/gestion-locative/", // ❌ DOUBLON À SUPPRIMER
    "app/landing/",             // ❌ À RENOMMER → /pro
    "app/(auth)/",              // Auth callback ✅
  ],

  // 2. Composants réutilisables
  "components": {
    "PropertyCard": "components/property/property-card-unified.tsx",
    "TenantCard": "app/(workspace)/gestion/components/TenantCard.tsx",
    "AddTenantButton": "app/(workspace)/gestion/components/AddTenantButton.tsx",
    "OwnerSelector": "components/gestion/OwnerSelector.tsx",
    "TeamPropertyCard": "components/gestion/TeamPropertyCard.tsx",
  },

  // 3. Actions serveur existantes
  "serverActions": {
    "gestion/actions.ts": "CRUD biens, locataires, baux",
    "compte/actions.ts": "Profil utilisateur",
    "equipe/actions.ts": "Gestion team members",
    "contract-actions.ts": "Génération contrats PDF",
  },

  // 4. Hooks et utils
  "hooks": {
    "lib/permissions.ts": "Vérification rôles et accès",
    "lib/team-permissions.ts": "Permissions équipe",
    "lib/auth-redirect.ts": "Logique de redirection",
    "lib/notifications.ts": "Système de notifications",
  },

  // 5. Types existants
  "types": {
    "types/property.ts": "Property, PropertyStatus, etc.",
    "lib/types.ts": "Types métier globaux",
  }
};
```

### 0.5 Principes d'Implémentation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              PRINCIPES D'IMPLÉMENTATION (OBLIGATOIRES)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1️⃣  ANALYSER AVANT DE CODER                                             │
│   ───────────────────────────                                               │
│   → Lire les fichiers existants concernés                                  │
│   → Identifier les patterns utilisés                                       │
│   → Vérifier les types déjà définis                                       │
│                                                                             │
│   2️⃣  MODIFIER PLUTÔT QUE CRÉER                                           │
│   ────────────────────────────────                                          │
│   → Étendre un composant existant si possible                              │
│   → Ajouter un champ à une table plutôt qu'une nouvelle table             │
│   → Réutiliser les Server Actions existantes                               │
│                                                                             │
│   3️⃣  COHÉRENCE DES PATTERNS                                              │
│   ───────────────────────────                                               │
│   → Suivre le style Tailwind + "Luxe & Teranga" existant                  │
│   → Utiliser les mêmes hooks (React Query, etc.)                          │
│   → Respecter la structure des layouts                                     │
│                                                                             │
│   4️⃣  TESTER LA COHÉRENCE                                                 │
│   ────────────────────────                                                  │
│   → Vérifier que les imports sont top-down (UI → Domain → Data)           │
│   → Valider les permissions avec lib/permissions.ts                        │
│   → Tester les redirections post-login                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 0.6 Mapping Existant → Nouveau

| Ce qui EXISTE | Ce qu'on FAIT | Action |
|---------------|---------------|--------|
| `app/(webapp)/gestion-locative/` | Supprimer | Rediriger vers `/gestion` |
| `app/landing/` | Renommer | → `app/pro/` |
| `app/landing/commencer/` | Fusionner | → `app/pro/start/` |
| `leases.tenant_*` | Réutiliser | Ajouter champs pour Magic Link |
| `profiles.user_type` | Modifier | Supprimer "tenant" des valeurs possibles |
| `profiles.pro_status` | Ajouter si absent | "none" \| "trial" \| "active" \| "expired" |
| `lib/auth-redirect.ts` | Modifier | Implémenter Smart Redirect v2 |
| `components/gestion/TenantCard.tsx` | Réutiliser | Pas de nouveau composant |

### 0.7 Nouvelles Tables/Colonnes Requises

> **Principe** : Ajouter des colonnes aux tables existantes plutôt que créer de nouvelles tables.

```sql
-- ✅ MODIFICATIONS sur tables existantes (pas de nouvelles tables)

-- 1. profiles : ajouter pro_status si absent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pro_status TEXT DEFAULT 'none'
  CHECK (pro_status IN ('none', 'trial', 'active', 'expired'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pro_trial_ends_at TIMESTAMPTZ;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. leases : ajouter champs pour Magic Link tenant
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_access_token TEXT;

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_token_expires_at TIMESTAMPTZ;

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_token_verified BOOLEAN DEFAULT false;

ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_last_access_at TIMESTAMPTZ;

-- ⚠️ PAS de nouvelle table "tenants" - utiliser les champs tenant_* dans leases
-- ⚠️ PAS de nouvelle table "tenant_access_tokens" - token dans leases directement
```

---

## 1. Diagnostic des Problèmes Actuels

### Problèmes Identifiés

| Problème | Impact | Gravité |
|----------|--------|---------|
| **Deux chemins d'inscription** (`/register` vs `/landing/commencer`) | Confusion utilisateur, doublons de code | 🔴 Élevée |
| **Deux dashboards** (`/gestion-locative` vs `/gestion`) | Maintenance double, UX incohérente | 🔴 Élevée |
| **Inscription = Accès gestion automatique** | Tous les inscrits ont accès même sans besoin | 🟡 Moyenne |
| **Route `/locataire` référencée mais inexistante** | Parcours locataire incomplet | 🟡 Moyenne |
| **Paramètres de redirect incohérents** (`?next=` vs `?redirect=`) | Bugs potentiels, code difficile à maintenir | 🟢 Faible |

### Architecture Actuelle (Confuse)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ÉTAT ACTUEL (PROBLÉMATIQUE)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   /landing ──────┬──→ /landing/commencer ──→ Wizard 4 étapes               │
│                  │           ↓                    ↓                         │
│                  │    Crée User + Team      /gestion (workspace)            │
│                  │                                                          │
│   / (vitrine) ───┼──→ /register ──→ Simple signup                          │
│                  │           ↓                                              │
│                  │    Crée User seul ──→ ???  (vers où?)                   │
│                  │                                                          │
│                  └──→ /login ──→ Smart redirect                             │
│                            ↓                                                │
│                    ┌──────────────────────┐                                 │
│                    │ Team member? → /gestion                                │
│                    │ Owner? → /gestion                                      │
│                    │ Tenant? → /locataire (N'EXISTE PAS!)                  │
│                    │ Autre? → /                                             │
│                    └──────────────────────┘                                 │
│                                                                             │
│   /gestion-locative (webapp) ←──→ /gestion (workspace)                     │
│         ↑                              ↑                                    │
│    DOUBLON! Même fonctionnalités, layouts différents                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Personas Utilisateurs

### 2.1 Définition des Personas (Rôles Métier)

| Persona | Code Système | Description | Intention | Destination |
|---------|--------------|-------------|-----------|-------------|
| 🔍 **Prospect** | `prospect` | Cherche un bien à louer/acheter | Consulter les annonces | Vitrine publique |
| 🔑 **Locataire** | `tenant` | A un bail actif, veut suivre son logement | Accéder à son espace locataire | Dashboard locataire |
| 🏢 **Propriétaire** | `owner` | Possède des biens, veut les gérer | Accéder à la gestion locative | Dashboard gestion |
| 👔 **Gestionnaire** | `team_member` | Professionnel/agence de gestion | Gérer un parc immobilier + équipe | Dashboard gestion + team |

> **Note**: "Visiteur inscrit" devient **Prospect** - un rôle métier clair qui aide pour les règles d'accès, analytics et futures features (messagerie, alertes).

### 2.2 Matrice Persona → Fonctionnalité

```
                        Vitrine   Recherche   Favoris   Espace      Gestion    Team
                        Publique  Avancée     Alertes   Locataire   Biens      Mgmt
─────────────────────────────────────────────────────────────────────────────────────
Anonyme                   ✅        ✅         ⚡         ❌          ❌         ❌
Prospect (inscrit)        ✅        ✅         ✅         ❌          ❌         ❌
Locataire                 ✅        ✅         ✅         ✅          ❌         ❌
Propriétaire              ✅        ✅         ✅         ❌          ✅         ❌
Gestionnaire/Agence       ✅        ✅         ✅         ❌          ✅         ✅
```

> ⚡ = Favoris anonymes en localStorage, sync après inscription

---

## 3. Workflow Proposé

### 3.1 Schéma Global des Parcours

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW PROPOSÉ (STANDARDISÉ)                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                              ┌──────────────────┐                                   │
│                              │   POINTS D'ENTRÉE │                                   │
│                              └────────┬─────────┘                                   │
│                                       │                                             │
│              ┌────────────────────────┼────────────────────────┐                   │
│              ▼                        ▼                        ▼                   │
│    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐          │
│    │  / (Vitrine)    │      │   /pro (B2B)    │      │  /locataire     │          │
│    │  Marketplace    │      │  Marketing Pro  │      │  (Magic Link)   │          │
│    └────────┬────────┘      └────────┬────────┘      └────────┬────────┘          │
│             │                        │                        │                    │
│             ▼                        ▼                        ▼                    │
│    ┌─────────────────────────────────────────────────────────────────────┐        │
│    │                         AUTHENTIFICATION                             │        │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │        │
│    │  │   /login    │  │  /register  │  │  /pro/start │  │ Magic Link │  │        │
│    │  │  (Connexion)│  │ (Prospect)  │  │(Essai Pro)  │  │  (Tenant)  │  │        │
│    │  │             │  │             │  │             │  │            │  │        │
│    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │        │
│    └─────────┼────────────────┼────────────────┼───────────────┼─────────┘        │
│              │                │                │               │                   │
│              │                ▼                │               │                   │
│              │         ┌─────────────┐         │               │                   │
│              │         │ /bienvenue  │         │               │                   │
│              │         │ (Post-reg)  │         │               │                   │
│              │         └──────┬──────┘         │               │                   │
│              │                │                │               │                   │
│              └────────────────┼────────────────┘               │                   │
│                               ▼                                ▼                   │
│                    ┌───────────────────────┐         ┌─────────────────┐          │
│                    │  SMART REDIRECT       │         │  TENANT REDIRECT│          │
│                    │  (Basé sur pro_status)│         │  (Direct)       │          │
│                    └───────────┬───────────┘         └────────┬────────┘          │
│                                │                              │                    │
│         ┌──────────────────────┼──────────────────────┐       │                    │
│         ▼                      ▼                      ▼       ▼                    │
│   ┌───────────┐        ┌─────────────┐        ┌─────────────────┐                 │
│   │     /     │        │   /gestion  │        │   /locataire    │                 │
│   │  Vitrine  │        │  Dashboard  │        │    Dashboard    │                 │
│   │  (Défaut) │        │   Pro/Owner │        │    Locataire    │                 │
│   └───────────┘        └─────────────┘        └─────────────────┘                 │
│                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Routes Proposées

| Route | Rôle | Accès | Layout |
|-------|------|-------|--------|
| `/` | Vitrine publique, marketplace | Public | Vitrine |
| `/recherche` | Recherche avancée | Public | Vitrine |
| `/bien/[id]` | Détail d'un bien | Public | Vitrine |
| `/login` | Connexion | Public | Auth minimal |
| `/register` | Inscription prospect | Public | Auth minimal |
| `/pro` | Landing marketing B2B | Public | Pro/Marketing |
| `/pro/start` | Essai gratuit (wizard) | Public | Auth + Wizard |
| `/pro/pricing` | Grille tarifaire | Public | Pro/Marketing |
| `/gestion` | Dashboard propriétaire/gestionnaire | Authentifié (owner/team) | Workspace |
| `/locataire` | Dashboard locataire | Authentifié (tenant) | Tenant |
| `/compte` | Paramètres du compte | Authentifié | Adaptatif |
| `/bienvenue` | Post-inscription (nouveau) | Authentifié | Minimal |

> **Convention**: `/landing` devient `/pro` - C'est une route produit, pas un terme interne.

### 3.3 Suppression des Doublons

```diff
Routes à SUPPRIMER/FUSIONNER:
─────────────────────────────────

- /landing              →  Renommer vers /pro (route produit)
- /landing/commencer    →  Fusionner vers /pro/start
- /gestion-locative/*   →  SUPPRIMER (doublon de /gestion)
- /onboarding           →  SUPPRIMER (unused)

Routes à CRÉER:
───────────────

+ /pro                  →  Landing marketing B2B (ex /landing)
+ /pro/start            →  Essai gratuit (ex /landing/commencer)
+ /pro/pricing          →  Grille tarifaire
+ /locataire            →  Dashboard locataire
+ /bienvenue            →  Écran post-inscription
+ /compte/upgrade       →  Upgrade vers formule Pro
```

---

## 4. Détail des Parcours

### 4.1 Parcours Visiteur (Chercheur de bien)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARCOURS VISITEUR                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Arrivée: / (Vitrine)                                        │
│         │                                                       │
│         ├──→ Navigation libre (recherche, filtres, favoris)   │
│         │                                                       │
│         ├──→ [Favori] ──→ Prompt "Créer un compte"             │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              /register (Simple)                       │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              Compte créé (gestion_locative = false)   │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              Retour vers / (vitrine)                  │
│         │                                                       │
│         └──→ [Contact Propriétaire] ──→ Même flow              │
│                                                                 │
│    RÉSULTAT:                                                   │
│    - Compte avec accès aux favoris et alertes                  │
│    - PAS d'accès à /gestion (gestion_locative = false)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Différenciateur clé**: L'inscription simple via `/register` ne donne PAS accès à `/gestion`.
Le `pro_status` reste `"none"`.

### 4.1.1 Écran Post-Inscription (/bienvenue)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ÉCRAN BIENVENUE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    CONDITION D'AFFICHAGE (éviter fatigue UX)                   │
│    ──────────────────────────────────────────                   │
│                                                                 │
│    Afficher /bienvenue UNIQUEMENT si :                         │
│      ✓ first_login === true (premier login)                   │
│      ✓ user_type === "prospect"                                │
│                                                                 │
│    Sinon → Smart Redirect normal                               │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    Après /register (prospect, first login)                     │
│         │                                                       │
│         ▼                                                       │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │                                                         │ │
│    │   🎉 Bienvenue sur Dousell !                           │ │
│    │                                                         │ │
│    │   Votre compte a été créé avec succès.                 │ │
│    │                                                         │ │
│    │   ┌───────────────────┐  ┌───────────────────┐        │ │
│    │   │ 🔍 Chercher un    │  │ 🏢 Gérer mes      │        │ │
│    │   │    bien           │  │    biens (Pro)    │        │ │
│    │   │                   │  │                   │        │ │
│    │   │   → / (vitrine)   │  │   → /pro/start    │        │ │
│    │   └───────────────────┘  └───────────────────┘        │ │
│    │                                                         │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    AVANTAGES:                                                  │
│    ✓ UX moins froide après inscription                         │
│    ✓ CTA clair pour conversion Pro                             │
│    ✓ Pas de mélange des parcours                               │
│    ✓ Pas d'écran inutile pour users récurrents                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Logique d'affichage /bienvenue
function shouldShowBienvenue(profile: Profile): boolean {
  return profile.first_login === true &&
         profile.user_type === "prospect";
}

// Après affichage, marquer first_login = false
async function markFirstLoginComplete(userId: string) {
  await updateProfile(userId, { first_login: false });
}
```

### 4.1.2 Gestion des Favoris Anonymes

```
┌─────────────────────────────────────────────────────────────────┐
│                STRATÉGIE FAVORIS ANONYMES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ANONYME (localStorage)                                       │
│    ──────────────────────                                       │
│    → Favoris stockés en localStorage                            │
│    → Max 10 favoris côté client (évite spam)                   │
│    → Prompt login après 3 favoris                               │
│                                                                 │
│    INSCRIPTION / LOGIN                                          │
│    ────────────────────                                         │
│    → Sync explicite au login :                                  │
│      "Vous aviez 5 favoris. Voulez-vous les importer ?"        │
│    → Fusion intelligente (pas de doublons)                     │
│    → Clear localStorage après sync                              │
│                                                                 │
│    LIMITES BACKEND (performance)                               │
│    ─────────────────────────────                                │
│    → Max sync = 50 favoris par requête                         │
│    → Au-delà → silent trim FIFO (garder les 50 plus récents)   │
│    → Max total DB = 100 favoris par user                       │
│    → Payload max = 10KB par requête sync                       │
│                                                                 │
│    EDGE CASES GÉRÉS                                            │
│    ─────────────────                                            │
│    → Bien supprimé entre-temps → skip silencieux               │
│    → Conflit existant → garder le plus récent                  │
│    → localStorage inaccessible → mode dégradé gracieux         │
│    → Payload trop gros → trim + warning                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│        LIMITES FRONT vs BACK (NE PAS "ALIGNER")                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   FRONT (localStorage) : max 10 favoris                        │
│   ─────────────────────────────────────                         │
│   → Objectif: UX légère, feedback immédiat                     │
│   → Prompt login après 3 favoris (conversion)                  │
│   → Limite basse = incitation à s'inscrire                     │
│                                                                 │
│   BACK (API sync) : max 50/requête, 100/user                   │
│   ─────────────────────────────────────────                     │
│   → Objectif: Sécurité + Performance                           │
│   → Éviter les abus (bots, scraping)                           │
│   → Limite haute = users inscrits ont plus de libertés        │
│                                                                 │
│   ⚠️  Ces limites servent des OBJECTIFS DIFFÉRENTS            │
│   ⚠️  Ne pas "harmoniser" sous prétexte de cohérence          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Backend: Sync favoris anonymes
const FAVORITES_LIMITS = {
  maxSyncPerRequest: 50,    // Sécurité: limiter payload
  maxTotalPerUser: 100,     // Perf: limiter stockage par user
  maxPayloadSize: 10240,    // 10KB max - protection DDoS
};

// Front: UX anonyme
const ANONYMOUS_FAVORITES_LIMITS = {
  maxLocalStorage: 10,      // UX: garder léger, pousser à l'inscription
  promptLoginAfter: 3,      // Conversion: moment idéal pour proposer signup
};

async function syncAnonymousFavorites(userId: string, favorites: string[]) {
  // Trim FIFO si dépassement
  const trimmedFavorites = favorites.slice(-FAVORITES_LIMITS.maxSyncPerRequest);

  // Valider les biens existent encore
  const validPropertyIds = await validatePropertyIds(trimmedFavorites);

  // Merge avec existants (UPSERT)
  await upsertFavorites(userId, validPropertyIds);

  return {
    synced: validPropertyIds.length,
    skipped: favorites.length - validPropertyIds.length,
  };
}
```

### 4.2 Parcours Propriétaire/Gestionnaire (Pro)

```
┌─────────────────────────────────────────────────────────────────┐
│               PARCOURS PROPRIÉTAIRE (ESSAI GRATUIT)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Arrivée: /pro (Page Marketing B2B)                          │
│         │                                                       │
│         ├──→ CTA "Démarrer votre essai gratuit"                │
│         │                                                       │
│         ▼                                                       │
│    /pro/start (Wizard en 5 étapes - optimisé drop-off)        │
│         │                                                       │
│         ├── Étape 1: Compte (léger = moins de friction)        │
│         │   (email + mot de passe uniquement)                  │
│         │                                                       │
│         ├── Étape 2: Profil personnel                          │
│         │   (nom, téléphone)                                   │
│         │                                                       │
│         ├── Étape 3: Informations Agence (optionnel)           │
│         │   (nom société, NINEA, adresse, logo)                │
│         │                                                       │
│         ├── Étape 4: Objectifs                                 │
│         │   (types de biens, taille équipe)                    │
│         │                                                       │
│         └── Étape 5: Confirmation                              │
│                     │                                           │
│                     ▼                                           │
│              submitOnboarding()                                 │
│                     │                                           │
│                     ├── Créer User (auth.signUp)               │
│                     ├── pro_status = "trial"                   │
│                     ├── pro_trial_ends_at = +14 jours          │
│                     ├── user_type = "owner"                    │
│                     ├── Créer Team (si info agence)            │
│                     └── Ajouter user comme team owner          │
│                     │                                           │
│                     ▼                                           │
│              Redirect → /gestion (Dashboard Pro)               │
│                                                                 │
│    RÉSULTAT:                                                   │
│    - Compte avec accès complet à /gestion                      │
│    - Team créée (prête pour inviter membres)                   │
│    - Essai gratuit de 14 jours (pro_trial_ends_at tracké)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Parcours Locataire (Token-Based, SANS Compte)

> **Rappel** : Les locataires n'ont PAS de compte `auth.users`. Accès via Magic Link uniquement.

```
┌─────────────────────────────────────────────────────────────────┐
│              PARCOURS LOCATAIRE (MODÈLE HYBRIDE)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ⚠️ PAS DE /login POUR LES LOCATAIRES                       │
│    ⚠️ PAS DE MOT DE PASSE                                      │
│    ⚠️ ACCÈS VIA MAGIC LINK UNIQUEMENT                          │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    ÉTAPE 1: Propriétaire crée le bail                          │
│    ─────────────────────────────────                            │
│                                                                 │
│    1. Propriétaire va sur /gestion/locataires                  │
│         │                                                       │
│         ▼                                                       │
│    2. Clique "Ajouter un locataire"                            │
│         │                                                       │
│         ▼                                                       │
│    3. Saisit: Nom, Prénom, Email, Téléphone                    │
│         │                                                       │
│         ▼                                                       │
│    4. Associe au bien et crée le bail                          │
│         │                                                       │
│         ▼                                                       │
│    5. Système crée:                                            │
│       → Entrée dans `tenants` (SANS user_id)                   │
│       → Entrée dans `leases` (bail actif)                      │
│       → Token dans `tenant_access_tokens` (7 jours)            │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    ÉTAPE 2: Locataire reçoit l'invitation                      │
│    ─────────────────────────────────────                        │
│                                                                 │
│    1. Email envoyé: "Accédez à votre espace locataire"         │
│         │                                                       │
│         ▼                                                       │
│    2. Lien: /locataire?token=abc123xyz                         │
│         │                                                       │
│         ▼                                                       │
│    3. Locataire clique                                         │
│         │                                                       │
│         ▼                                                       │
│    4. Middleware valide le token:                              │
│       ✓ Token existe ?                                         │
│       ✓ Non expiré ?                                           │
│       ✓ Non révoqué ?                                          │
│       ✓ Bail actif ?                                           │
│         │                                                       │
│         ▼                                                       │
│    5. Cookie session créé (24h, path=/locataire)               │
│         │                                                       │
│         ▼                                                       │
│    6. Accès à /locataire (Dashboard personnel)                 │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    ÉTAPE 3: Accès ultérieur (même appareil)                    │
│    ─────────────────────────────────────                        │
│                                                                 │
│    → Cookie session toujours valide → accès direct             │
│    → Cookie expiré → demander nouveau lien par email           │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    FONCTIONNALITÉS /locataire                                  │
│    ─────────────────────────                                    │
│                                                                 │
│    ✅ Voir son bail et documents                               │
│    ✅ Consulter l'historique des paiements                     │
│    ✅ Télécharger quittances                                   │
│    ✅ Signaler un incident                                     │
│    ✅ Voir les infos du logement                               │
│    ❌ PAS d'accès à /gestion                                   │
│    ❌ PAS d'accès à /compte                                    │
│    ❌ PAS de navigation vers d'autres sections                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Renouvellement d'Accès

```
┌─────────────────────────────────────────────────────────────────┐
│              RENOUVELLEMENT TOKEN LOCATAIRE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Token expire dans 7 jours                                    │
│                                                                 │
│   OPTION A: Rappel automatique (recommandé)                    │
│   ─────────────────────────────────────────                     │
│   → Cron job à J-1 avant expiration                            │
│   → Email: "Votre accès expire demain"                         │
│   → Nouveau lien dans l'email                                  │
│                                                                 │
│   OPTION B: Demande manuelle                                   │
│   ─────────────────────────────                                 │
│   → Locataire sur /locataire/expired                           │
│   → Saisit son email                                           │
│   → Si email connu → nouveau lien envoyé                       │
│   → Rate limit: 1 demande / heure                              │
│                                                                 │
│   OPTION C: Propriétaire renvoie                               │
│   ───────────────────────────────                               │
│   → Depuis /gestion/locataires/[id]                            │
│   → Bouton "Renvoyer l'invitation"                             │
│   → Révoque ancien token + crée nouveau                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Page /locataire/expired

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🔒 Votre session a expiré                                    │
│                                                                 │
│   Pour des raisons de sécurité, l'accès à votre espace        │
│   locataire est limité dans le temps.                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Votre adresse email                                    │  │
│   │  [_________________________]                            │  │
│   │                                                         │  │
│   │              [ Recevoir un nouveau lien ]              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Vous recevrez un email avec un nouveau lien d'accès         │
│   si votre bail est toujours actif.                           │
│                                                                 │
│   ─────────────────────────────────────────────────────────── │
│                                                                 │
│   Besoin d'aide ? Contactez votre propriétaire.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Parcours Upgrade (Prospect → Pro)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARCOURS UPGRADE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Prospect inscrit via /register (pro_status = "none")        │
│         │                                                       │
│         ├──→ Visite /pro et voit CTA "Essai gratuit"          │
│         │    OU banner dans /bienvenue                         │
│         │    OU CTA dans header vitrine                        │
│         │                                                       │
│         ▼                                                       │
│    /compte/upgrade                                              │
│         │                                                       │
│         ├── Affiche les avantages Pro                          │
│         ├── Wizard simplifié (infos agence seulement)          │
│         │   (user déjà créé, juste compléter)                  │
│         │                                                       │
│         ▼                                                       │
│    upgradeToProAction()                                        │
│         │                                                       │
│         ├── pro_status = "trial"                               │
│         ├── pro_trial_ends_at = +14 jours                      │
│         ├── user_type = "owner"                                │
│         ├── Créer Team                                         │
│         └── Link user as team owner                            │
│         │                                                       │
│         ▼                                                       │
│    Redirect → /gestion                                         │
│                                                                 │
│    AVANTAGES:                                                  │
│    ✓ Pas de doublon de compte                                  │
│    ✓ Historique favoris préservé                               │
│    ✓ Transition fluide                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Cas Spécial : Owner qui est aussi Locataire

> **Note** : Ce cas est rare mais doit être géré proprement. Un owner (auth.user) peut aussi louer un bien chez un autre propriétaire.

```
┌─────────────────────────────────────────────────────────────────┐
│              CAS SPÉCIAL: OWNER + TENANT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Exemple réel:                                                │
│    → Jean possède 2 appartements (owner dans auth.users)       │
│    → Jean loue aussi un bureau (tenant chez Paul)              │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    TECHNIQUEMENT:                                              │
│    ──────────────                                               │
│                                                                 │
│    Jean a DEUX identités:                                      │
│                                                                 │
│    1. USER SYSTÈME (auth.users)                                │
│       → Email: jean@exemple.com                                │
│       → Mot de passe                                           │
│       → Accès /gestion (ses propres biens)                     │
│                                                                 │
│    2. TENANT CHEZ PAUL (table tenants)                         │
│       → Entrée dans tenants avec son email                     │
│       → Token d'accès /locataire                               │
│       → Scope: uniquement son bail chez Paul                   │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    FLUX D'ACCÈS:                                               │
│    ─────────────                                                │
│                                                                 │
│    → Jean va sur /login → accède à /gestion (ses biens)        │
│    → Jean clique Magic Link → accède à /locataire (son bail)   │
│                                                                 │
│    ⚠️ CE SONT DEUX SESSIONS DISTINCTES                        │
│    → Session auth.users (cookie Supabase)                      │
│    → Session tenant (cookie tenant_session)                    │
│                                                                 │
│    ───────────────────────────────────────────────────────────│
│                                                                 │
│    SWITCH ROLE (dans /gestion uniquement)                      │
│    ──────────────────────────────────────                       │
│                                                                 │
│    Si l'email de l'owner correspond à un tenant:               │
│                                                                 │
│    ┌─────────────────────────────────────────┐                 │
│    │  👤 Jean Dupont                    ▼   │                 │
│    ├─────────────────────────────────────────┤                 │
│    │  🏢 Dashboard gestion             ← actif                │
│    │  🏠 Mon espace locataire (chez Paul)   │                 │
│    │  ─────────────────────────             │                 │
│    │  ⚙️  Paramètres du compte              │                 │
│    │  🚪 Déconnexion                        │                 │
│    └─────────────────────────────────────────┘                 │
│                                                                 │
│    Clic sur "Mon espace locataire":                            │
│    → Vérifie si token tenant valide                            │
│    → Si oui → redirect /locataire                              │
│    → Si non → envoie nouveau Magic Link par email             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Détection si un owner a aussi un accès tenant (via table leases)
async function ownerHasTenantAccess(ownerEmail: string): Promise<TenantInfo | null> {
  // Chercher si cet email est référencé comme tenant dans un bail actif
  const { data: lease } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_first_name,
      tenant_last_name,
      tenant_access_token,
      property:properties (
        title,
        owner:profiles!properties_owner_id_fkey (
          full_name
        )
      )
    `)
    .eq("tenant_email", ownerEmail)
    .eq("status", "active")
    .single();

  if (!lease) return null;

  return {
    lease_id: lease.id,
    has_valid_token: !!lease.tenant_access_token,
    property_name: lease.property.title,
    landlord_name: lease.property.owner.full_name
  };
}

// Composant Switch Role (affiché dans /gestion pour owners)
function OwnerRoleSwitcher({ ownerEmail }: { ownerEmail: string }) {
  const { data: tenantInfo } = useOwnerTenantAccess(ownerEmail);

  // Pas de switch si l'owner n'est pas aussi locataire
  if (!tenantInfo) return null;

  const handleSwitchToTenant = async () => {
    if (tenantInfo.has_valid_token) {
      // Token valide → récupérer et redirect
      const { data } = await supabase
        .from("leases")
        .select("tenant_access_token")
        .eq("id", tenantInfo.lease_id)
        .single();

      if (data?.tenant_access_token) {
        window.location.href = `/locataire?token=${data.tenant_access_token}`;
        return;
      }
    }

    // Pas de token valide → générer et envoyer Magic Link
    await generateAndSendTenantMagicLink(tenantInfo.lease_id);
    toast.success("Un lien d'accès a été envoyé à votre email");
  };

  return (
    <DropdownItem onClick={handleSwitchToTenant}>
      🏠 Mon espace locataire (chez {tenantInfo.landlord_name})
    </DropdownItem>
  );
}
```

---

## 5. Logique de Redirection Standardisée

### 5.1 Modèle de Données Amélioré

Au lieu d'un simple booléen `gestion_locative_enabled`, on anticipe l'évolution :

```typescript
// profiles table - champs recommandés (UTILISATEURS SYSTÈME UNIQUEMENT)
interface ProfileProFields {
  // Rôle métier explicite - ⚠️ PAS DE "tenant" ICI
  user_type: "prospect" | "owner" | "team_member";

  // Statut Pro (évolutif)
  pro_status: "none" | "trial" | "active" | "expired";
  pro_trial_ends_at: Date | null;  // Fin de l'essai gratuit

  // Rôle dans une équipe (si applicable)
  pro_role: "owner" | "admin" | "member" | null;
}

// Dérivé pour rétro-compatibilité
const gestion_locative_enabled =
  pro_status === "trial" || pro_status === "active";
```

**Avantages** :
- Gère trial expiré sans migration
- Prêt pour les plans (free/pro/agency)
- Droits partiels possibles à terme
- Analytics plus riches

---

### 5.1.1 User vs Tenant : Modèle Volontairement Distinct (CRITIQUE)

> **Principe fondamental** : Un locataire n'est PAS un utilisateur système, mais PEUT avoir un accès applicatif sécurisé.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE USER vs TENANT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🔹 USER (Utilisateur Système)              🔹 TENANT (Entité Métier)     │
│   ─────────────────────────────              ─────────────────────────     │
│                                                                             │
│   Table: auth.users + profiles               Table: tenants                │
│   Authentification: Email + Mot de passe     Authentification: Magic Link  │
│   Session: Persistante (JWT Supabase)        Session: Token temporaire     │
│   Scope: /gestion, /compte, /                Scope: /locataire uniquement  │
│   Création: Inscription volontaire           Création: Par le propriétaire │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────  │
│                                                                             │
│   ⚠️  UN LOCATAIRE N'A PAS DE COMPTE UTILISATEUR                          │
│   ⚠️  UN LOCATAIRE ACCÈDE VIA MAGIC LINK (token signé)                    │
│   ⚠️  ZÉRO MOT DE PASSE, ZÉRO ENTRÉE DANS auth.users                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tableau Comparatif des Accès

| Élément | Owner | Team Member | Tenant |
|---------|-------|-------------|--------|
| `auth.users` | ✅ | ✅ | ❌ |
| `profiles` | ✅ | ✅ | ❌ |
| Mot de passe | ✅ | ✅ | ❌ |
| Magic Link | ❌ | ❌ | ✅ |
| Session persistante | ✅ | ✅ | ❌ |
| Accès `/gestion` | ✅ | ✅ | ❌ |
| Accès `/locataire` | ❌ | ❌ | ✅ |
| Accès `/compte` | ✅ | ✅ | ❌ |
| API owner/team | ✅ | ✅ | ❌ |

#### Tenant Access (via table leases existante)

> **IMPORTANT** : Pas de nouvelle table `tenants`. Utiliser les champs `tenant_*` existants dans `leases`.

```typescript
// Interface Lease EXISTANTE - avec champs tenant intégrés
// Voir: types/property.ts ou lib/types.ts
interface Lease {
  id: string;
  property_id: string;
  owner_id: string;
  status: "active" | "ended" | "pending";
  start_date: Date;
  end_date: Date;
  rent_amount: number;          // En centimes (CLAUDE.md)

  // Infos locataire EXISTANTES dans leases
  tenant_first_name: string;
  tenant_last_name: string;
  tenant_email: string;
  tenant_phone?: string;

  // ⚠️ PAS DE tenant_user_id - le locataire n'est pas dans auth.users

  // Champs Magic Link À AJOUTER (voir section 0.7)
  tenant_access_token?: string;        // Token signé (nullable)
  tenant_token_expires_at?: Date;      // Expiration (7 jours)
  tenant_token_verified?: boolean;     // Premier accès validé
  tenant_last_access_at?: Date;        // Dernier accès

  created_at: Date;
  updated_at: Date;
}

// ⚠️ PAS de table tenant_access_tokens séparée
// Le token est stocké DIRECTEMENT dans leases.tenant_access_token
```

#### Flux d'Accès Tenant (Magic Link)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX MAGIC LINK TENANT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. Propriétaire ajoute locataire (email + infos)             │
│         │                                                       │
│         ▼                                                       │
│   2. Système génère token signé (7 jours)                      │
│         │                                                       │
│         ▼                                                       │
│   3. Email envoyé : "Accédez à votre espace locataire"         │
│         │                                                       │
│         ▼                                                       │
│   4. Locataire clique → /locataire?token=xxxxx                 │
│         │                                                       │
│         ▼                                                       │
│   5. Validation token :                                        │
│      ✓ Token valide ?                                          │
│      ✓ Non expiré ?                                            │
│      ✓ Bail actif ?                                            │
│         │                                                       │
│         ▼                                                       │
│   6. Session cookie tenant (HttpOnly, 24h)                     │
│         │                                                       │
│         ▼                                                       │
│   7. Accès /locataire (scope limité)                           │
│                                                                 │
│   ───────────────────────────────────────────────────────────  │
│                                                                 │
│   RENOUVELLEMENT :                                             │
│   → Token expire dans 7 jours                                  │
│   → Propriétaire peut renvoyer un lien                         │
│   → OU système envoie rappel automatique avant expiration      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Règles de Sécurité Tenant

```typescript
// Middleware /locataire - utilise table LEASES (pas de table tenants séparée)
async function validateTenantAccess(request: Request): Promise<TenantSession | null> {
  // 1. Récupérer le cookie de session tenant
  const sessionCookie = cookies().get("tenant_session");

  // 2. OU récupérer le token depuis l'URL (premier accès)
  const urlToken = new URL(request.url).searchParams.get("token");

  const token = sessionCookie?.value || urlToken;
  if (!token) return null;

  // 3. Valider le token DIRECTEMENT dans la table leases
  const { data: lease } = await supabase
    .from("leases")
    .select(`
      id,
      property_id,
      status,
      tenant_first_name,
      tenant_last_name,
      tenant_email,
      tenant_access_token,
      tenant_token_expires_at,
      tenant_token_verified,
      property:properties (
        title,
        location
      )
    `)
    .eq("tenant_access_token", token)
    .eq("status", "active")
    .gt("tenant_token_expires_at", new Date().toISOString())
    .single();

  if (!lease) return null;

  // 4. Créer/renouveler le cookie de session (24h)
  if (urlToken) {
    cookies().set("tenant_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24h
      path: "/locataire"
    });

    // Marquer le dernier accès
    await supabase
      .from("leases")
      .update({ tenant_last_access_at: new Date().toISOString() })
      .eq("id", lease.id);
  }

  return {
    lease_id: lease.id,
    property_id: lease.property_id,
    tenant_name: `${lease.tenant_first_name} ${lease.tenant_last_name}`,
    property_title: lease.property.title,
    expires_at: new Date(lease.tenant_token_expires_at)
  };
}

// Protection des routes /locataire/*
function canAccessLocataire(session: TenantSession | null): boolean {
  return session !== null &&
         session.lease_id !== undefined &&
         new Date(session.expires_at) > new Date();
}
```

#### Évolution Future (Sans Blocage)

```
┌─────────────────────────────────────────────────────────────────┐
│              ÉVOLUTION POSSIBLE (PHASE 2+)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Quand on voudra :                                            │
│   → Paiement récurrent                                         │
│   → Historique long terme                                      │
│   → Messagerie avancée                                         │
│   → Notifications push                                         │
│                                                                 │
│   On pourra :                                                   │
│   → Ajouter un champ optional `user_id` dans `tenants`        │
│   → Proposer "Créer un compte" au locataire                    │
│   → Lier le tenant à un auth.user (promotion)                 │
│                                                                 │
│   MAIS PAS MAINTENANT.                                         │
│   Le modèle actuel est suffisant pour MVP.                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.1.2 Règle Multi-Rôles pour Users Système

> **Note** : Cette section concerne uniquement les utilisateurs système (`auth.users`), pas les tenants.

```
┌─────────────────────────────────────────────────────────────────┐
│              RÈGLE: user_type pour USERS SYSTÈME               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   user_type = RÔLE PRINCIPAL DÉCLARÉ (prospects, owners, team) │
│   ─────────────────────────────────────────────────────────────│
│   → Défini à l'inscription                                     │
│   → Stocké dans profiles.user_type                             │
│   → Utilisé pour analytics et segmentation                     │
│   → Valeurs : "prospect" | "owner" | "team_member"             │
│                                                                 │
│   ⚠️ "tenant" N'EST PAS une valeur valide pour user_type      │
│   ⚠️ Les locataires n'ont pas de profil dans profiles          │
│                                                                 │
│   ───────────────────────────────────────────────────────────  │
│                                                                 │
│   RÔLES EFFECTIFS = DÉDUITS PAR RELATIONS                     │
│   ─────────────────────────────────────────                     │
│   → isOwner = pro_status in ["trial", "active"]                │
│   → isTeamMember = team_members.exists(user_id)                │
│                                                                 │
│   CAS SPÉCIAL : Owner qui loue aussi un bien                   │
│   ─────────────────────────────────────────────                 │
│   → L'owner peut avoir un tenant_access_token                  │
│   → Accès /gestion ET /locataire (switch role)                 │
│   → Mais le tenant n'est PAS dans son profil                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Smart Redirect (Post-Login pour Users Système)

> **Important** : Cette logique concerne UNIQUEMENT les utilisateurs système (`auth.users`).
> Les locataires (tenants) n'utilisent PAS `/login` - ils accèdent via Magic Link.

```typescript
// Redirection post-login pour USERS SYSTÈME uniquement
async function getSmartRedirectPath(explicitNext?: string): Promise<string> {
  // 0. Priorité absolue: ?next= explicite
  if (explicitNext && isValidRedirectPath(explicitNext)) {
    return explicitNext;
  }

  const user = await getCurrentUser();
  if (!user) return "/";

  const profile = await getProfile(user.id);

  // 1. Propriétaire/Gestionnaire → /gestion
  if (profile.pro_status === "trial" || profile.pro_status === "active") {
    return "/gestion";
  }

  // 2. Team Member sans pro_status personnel → /gestion (via team)
  const teamMembership = await getTeamMembership(user.id);
  if (teamMembership) {
    return "/gestion";
  }

  // 3. Prospect → Vitrine (ou /bienvenue si first_login)
  if (profile.first_login && profile.user_type === "prospect") {
    return "/bienvenue";
  }

  return "/";
}

// ⚠️ PAS DE isTenant() ICI - les locataires n'ont pas de compte auth.users
```

**Règle clé** : Le Smart Redirect ne gère QUE les users système. L'accès `/locataire` se fait par une route séparée avec validation de token.

```
┌─────────────────────────────────────────────────────────────────┐
│              DEUX FLUX D'AUTHENTIFICATION DISTINCTS            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /login (Users Système)                                       │
│   ──────────────────────                                        │
│   → Email + Mot de passe                                       │
│   → OAuth Google                                               │
│   → Crée session auth.users                                    │
│   → Smart Redirect → /gestion ou /bienvenue                    │
│                                                                 │
│   /locataire?token=xxx (Tenants)                               │
│   ─────────────────────────────                                 │
│   → Magic Link reçu par email                                  │
│   → Validation token (pas de mot de passe)                     │
│   → Crée session cookie tenant (24h)                           │
│   → Accès /locataire/* uniquement                              │
│                                                                 │
│   ⚠️ CES DEUX FLUX SONT COMPLÈTEMENT SÉPARÉS                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Règle de Redirection /login

```
┌─────────────────────────────────────────────────────────────────┐
│                 RÈGLE DE REDIRECTION /login                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ORDRE DE PRIORITÉ (strict)                                   │
│   ──────────────────────────                                    │
│                                                                 │
│   1. ?next= explicite    →  utiliser next (si valide)          │
│   2. Smart Redirect      →  basé sur profil                    │
│   3. Fallback            →  / (vitrine)                        │
│                                                                 │
│   ───────────────────────────────────────────────────────────  │
│                                                                 │
│   EXEMPLES D'URLS                                              │
│   ───────────────                                               │
│                                                                 │
│   /login?next=/locataire    → vers /locataire (explicit)       │
│   /login?next=/gestion      → vers /gestion (explicit)         │
│   /login                    → smart redirect (profile-based)   │
│                                                                 │
│   ───────────────────────────────────────────────────────────  │
│                                                                 │
│   VALIDATION ?next=                                            │
│   ─────────────────                                             │
│                                                                 │
│   ✅ Autorisé: paths internes (/gestion, /locataire, /compte)  │
│   ❌ Bloqué: URLs externes, paths non-autorisés                │
│   ⚠️  Sanitize: échapper les caractères spéciaux              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Validation du paramètre next
function isValidRedirectPath(path: string): boolean {
  const allowedPaths = ["/", "/gestion", "/locataire", "/compte", "/bienvenue"];
  const allowedPrefixes = ["/gestion/", "/locataire/", "/compte/"];

  // Bloquer les URLs externes
  if (path.startsWith("http") || path.includes("://")) return false;

  // Vérifier les paths autorisés
  return allowedPaths.includes(path) ||
         allowedPrefixes.some(prefix => path.startsWith(prefix));
}
```

### 5.4 Protection des Routes

```typescript
// Middleware de protection - DEUX SYSTÈMES DISTINCTS

// 1. Protection routes USERS SYSTÈME (auth.users)
const USER_ROUTE_PROTECTION = {
  "/gestion/*": {
    requireAuth: true,  // auth.users session
    requireProStatus: ["trial", "active"],
    expiredHandler: "read_only_with_modal",  // Voir section 11.1
    redirectTo: "/pro/start"
  },
  "/compte/*": {
    requireAuth: true,  // auth.users session
    redirectTo: "/login"
  }
};

// 2. Protection routes TENANTS (token-based, PAS auth.users)
const TENANT_ROUTE_PROTECTION = {
  "/locataire/*": {
    requireTenantToken: true,  // ⚠️ PAS requireAuth
    redirectTo: "/locataire/expired"  // Page d'erreur dédiée
  }
};
```

### 5.4.1 Validation Accès Tenant (Token-Based via leases)

> **Important** : Pas de table `tenants` séparée. Token stocké dans `leases.tenant_access_token`.

```typescript
/**
 * MODÈLE HYBRIDE : Tenant Access via Token dans leases
 *
 * ⚠️ AUCUNE RÉFÉRENCE à auth.users
 * ⚠️ AUCUNE table tenants séparée - utiliser leases
 * ⚠️ Token stocké dans leases.tenant_access_token
 *
 * Un visiteur a accès à /locataire si :
 * 1. Il possède un token valide (URL ou cookie)
 * 2. Le token n'est pas expiré (leases.tenant_token_expires_at)
 * 3. Le bail est actif (leases.status = 'active')
 */

interface TenantSession {
  lease_id: string;
  property_id: string;
  tenant_name: string;
  property_title: string;
  expires_at: Date;
}

async function validateTenantToken(token: string): Promise<TenantSession | null> {
  // Valider le token DIRECTEMENT dans la table leases
  const { data: lease } = await supabase
    .from("leases")
    .select(`
      id,
      property_id,
      status,
      tenant_first_name,
      tenant_last_name,
      tenant_token_expires_at,
      property:properties (
        title
      )
    `)
    .eq("tenant_access_token", token)
    .eq("status", "active")
    .gt("tenant_token_expires_at", new Date().toISOString())
    .single();

  if (!lease) return null;

  return {
    lease_id: lease.id,
    property_id: lease.property_id,
    tenant_name: `${lease.tenant_first_name} ${lease.tenant_last_name}`,
    property_title: lease.property.title,
    expires_at: new Date(lease.tenant_token_expires_at)
  };
}

// Middleware /locataire - utilise leases directement
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/locataire")) {
    // Exclure la page /locataire/expired
    if (request.nextUrl.pathname === "/locataire/expired") {
      return NextResponse.next();
    }

    // 1. Chercher le token (cookie ou URL)
    const cookieToken = request.cookies.get("tenant_session")?.value;
    const urlToken = request.nextUrl.searchParams.get("token");
    const token = cookieToken || urlToken;

    if (!token) {
      return NextResponse.redirect(new URL("/locataire/expired", request.url));
    }

    // 2. Valider le token via leases
    const session = await validateTenantToken(token);
    if (!session) {
      return NextResponse.redirect(new URL("/locataire/expired", request.url));
    }

    // 3. Stocker en cookie si venu par URL (premier accès)
    const response = NextResponse.next();
    if (urlToken && !cookieToken) {
      response.cookies.set("tenant_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24h
        path: "/locataire"
      });

      // Marquer le dernier accès dans leases
      await supabase
        .from("leases")
        .update({ tenant_last_access_at: new Date().toISOString() })
        .eq("id", session.lease_id);
    }

    return response;
  }
}
```

**Pourquoi ce modèle** :
- ✅ Aucun mot de passe pour les locataires
- ✅ Accès temporaire et révocable
- ✅ Pas de pollution de `auth.users`
- ✅ Sécurité par token signé
- ✅ Scope limité à `/locataire/*`

---

## 6. Structure des Routes Finale

```
app/
├── (vitrine)/                    # Groupe public (marketplace)
│   ├── page.tsx                  # / - Home/Recherche
│   ├── recherche/                # Recherche avancée
│   ├── bien/[id]/                # Détail bien
│   ├── favoris/                  # Favoris (avec sync anonyme)
│   ├── contact/                  # Contact
│   └── layout.tsx                # Layout vitrine (header/footer)
│
├── (auth)/                       # Groupe authentification
│   ├── login/page.tsx            # Connexion
│   ├── register/page.tsx         # Inscription prospect
│   ├── bienvenue/page.tsx        # Post-inscription (NOUVEAU)
│   ├── callback/route.ts         # OAuth/Magic link callback
│   └── layout.tsx                # Layout auth minimal
│
├── pro/                          # Marketing B2B (ex /landing) - PAS de groupe!
│   ├── page.tsx                  # /pro - Landing principale
│   ├── start/page.tsx            # /pro/start - Wizard essai gratuit
│   ├── pricing/page.tsx          # /pro/pricing - Grille tarifaire
│   ├── a-propos/                 # /pro/a-propos
│   ├── syndic/                   # /pro/syndic
│   └── layout.tsx                # Layout pro (SEO optimized)
│
├── (workspace)/                  # Dashboard gestion (UNIQUE)
│   ├── gestion/                  # /gestion/*
│   │   ├── page.tsx              # Dashboard gestion principal
│   │   ├── biens/                # Gestion des biens
│   │   ├── locataires/           # Gestion locataires
│   │   ├── comptabilite/         # Comptabilité
│   │   ├── equipe/               # Gestion équipe
│   │   └── config/               # Configuration
│   └── layout.tsx                # Layout Dashboard gestion (sidebar)
│
├── (tenant)/                     # Dashboard locataire (NOUVEAU)
│   ├── locataire/                # /locataire/*
│   │   ├── page.tsx              # Dashboard locataire
│   │   ├── bail/                 # Mon bail
│   │   ├── paiements/            # Mes paiements
│   │   ├── documents/            # Mes documents
│   │   └── incidents/            # Signaler un problème
│   └── layout.tsx                # Layout tenant (simple)
│
├── (account)/                    # Paramètres compte
│   ├── compte/                   # /compte/*
│   │   ├── page.tsx              # Profil
│   │   ├── securite/             # Mot de passe, 2FA
│   │   └── upgrade/              # Passer à Pro
│   └── layout.tsx
│
└── api/                          # API routes
    ├── auth/
    ├── webhooks/
    └── ...
```

> **Note**: `/pro` n'est PAS un route group `(pro)` car on veut que `/pro` soit une vraie route accessible.

### 6.1 Vocabulaire Unifié

Pour éviter la confusion dans le code et la documentation, utiliser ces termes de manière cohérente :

| Terme Officiel | Éviter | Contexte |
|----------------|--------|----------|
| **Dashboard gestion** | workspace, SaaS, back-office | Espace propriétaire/gestionnaire |
| **Dashboard locataire** | tenant portal, espace tenant | Espace locataire |
| **Vitrine** | marketplace, front-office | Partie publique |
| **Prospect** | visiteur inscrit, user simple | Utilisateur sans rôle pro/tenant |

---

## 7. Migration Progressive

### Phase 1: Consolidation (Semaine 1)

```
□ Supprimer /gestion-locative/* (webapp) - Rediriger vers /gestion
□ Migrer /landing/commencer → /pro/start
□ Standardiser les paramètres redirect (?next= partout)
□ Implémenter le flag gestion_locative_enabled dans /register
```

### Phase 2: Création Tenant Dashboard (Semaine 2)

```
□ Créer (tenant)/locataire/* avec les routes de base
□ Layout tenant simple et mobile-first
□ Fonctionnalités: bail, paiements, documents, incidents
□ Magic link pour invitation locataire
```

### Phase 3: Upgrade Flow (Semaine 3)

```
□ Créer /compte/upgrade
□ Wizard simplifié (compléter infos agence)
□ Boutons "Passer à Pro" dans la vitrine pour users connectés
□ Email de bienvenue Pro
```

### Phase 4: Optimisation (Semaine 4)

```
□ Tests E2E de tous les parcours
□ Analytics sur les conversions
□ A/B testing des CTA
□ Documentation utilisateur
```

---

## 8. Résumé Visuel Simplifié

```
╔══════════════════════════════════════════════════════════════════════╗
║                     DOUSELL IMMO - PARCOURS UTILISATEURS             ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║     🌐 VITRINE          🏢 PRO/B2B           📱 ESPACES PRIVÉS       ║
║    ────────────        ────────────         ────────────────         ║
║                                                                      ║
║    ┌─────────┐        ┌─────────┐                                   ║
║    │    /    │        │  /pro   │                                   ║
║    │ (Home)  │        │ (B2B)   │                                   ║
║    └────┬────┘        └────┬────┘                                   ║
║         │                  │                                         ║
║         ▼                  ▼                                         ║
║    ┌─────────┐        ┌─────────┐                                   ║
║    │/register│        │  /pro/  │                                   ║
║    │(Prospect)│        │ start   │                                   ║
║    └────┬────┘        └────┬────┘                                   ║
║         │                  │                                         ║
║         ▼                  ▼                                         ║
║    ┌─────────┐        ┌─────────┐        ┌─────────────────┐        ║
║    │/bienvenue│       │pro_status│       │                 │        ║
║    │(Post-reg)│       │= "trial"│        │     /login      │        ║
║    └────┬────┘        │+ Team   │        │   (Connexion)   │        ║
║         │             └────┬────┘        └────────┬────────┘        ║
║         │                  │                      │                  ║
║         │                  │                      ▼                  ║
║         │                  │             ┌────────────────┐         ║
║         │                  │             │ SMART REDIRECT │         ║
║         │                  │             │ (pro_status?)  │         ║
║         │                  │             └───────┬────────┘         ║
║         │                  │                     │                   ║
║         │                  │       ┌─────────────┼─────────────┐    ║
║         ▼                  ▼       ▼             ▼             ▼    ║
║    ┌─────────┐        ┌─────────┐        ┌─────────────┐           ║
║    │    /    │        │/gestion │        │ /locataire  │           ║
║    │(Vitrine)│        │(Pro SaaS)│        │  (Tenant)   │           ║
║    │+ Favoris│        │         │        │             │           ║
║    └─────────┘        └─────────┘        └─────────────┘           ║
║                                                                      ║
║  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ║
║                                                                      ║
║    💡 UPGRADE: /bienvenue → /compte/upgrade → /gestion              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 9. Standards UI/UX Appliqués

### Mobile (iOS/Android)

| Standard | Implementation |
|----------|----------------|
| **Bottom Navigation** | 4 items max (Home, Search, Favorites, Profile) |
| **Safe Areas** | Respect des notches et home indicators |
| **Gestures** | Swipe-back natif, pull-to-refresh |
| **Loading States** | Skeletons, pas de spinners bloquants |

### Web

| Standard | Implementation |
|----------|----------------|
| **Progressive Disclosure** | Wizard par étapes, pas de formulaire géant |
| **Single Sign-On** | Google OAuth + Magic Links |
| **Responsive** | Mobile-first, breakpoints standards |
| **Accessibility** | Focus visible, aria-labels, contraste 4.5:1 |

### Patterns Reconnus

- **Freemium Gate**: Inscription gratuite → Features limitées → Upgrade CTA
- **Role-Based Redirect**: Redirection automatique selon le profil
- **Magic Links**: Onboarding locataire sans friction
- **Progressive Profiling**: Collecter les infos au fur et à mesure

---

## 10. Analytics & Métriques

### 10.1 KPIs de Conversion

| Métrique | Description | Objectif |
|----------|-------------|----------|
| **Funnel /pro/start** | Taux de complétion wizard par étape | > 60% |
| **Drop-off Wizard** | Étape où les users abandonnent | Identifier les frictions |
| **Prospect → Pro** | % d'inscrits simples qui upgrade | > 5% |
| **Magic Link Activation** | % de locataires qui activent leur compte | > 80% |
| **Time to First Property** | Temps entre inscription Pro et premier bien | < 24h |

### 10.2 Events à Tracker

```typescript
// Événements clés
const ANALYTICS_EVENTS = {
  // Inscription
  "register.started": { source: "vitrine" | "pro" },
  "register.completed": { user_type: string },
  "register.failed": { error: string },

  // Login (CRITIQUE pour debug)
  "login.started": { method: "password" | "magic_link" | "oauth" },
  "login.success": {
    method: "password" | "magic_link" | "oauth",
    user_type: string,
    has_next_param: boolean
  },
  "login.failed": { method: string, error: string },

  // Redirect (CRITIQUE pour debug des loops)
  "redirect.executed": {
    from: string,           // URL d'origine
    to: string,             // URL de destination
    reason: "explicit_next" | "smart_redirect" | "fallback" | "protection",
    user_roles: string[]    // Pour comprendre les décisions
  },

  // Wizard Pro
  "pro_wizard.step_viewed": { step: 1 | 2 | 3 | 4 | 5 },
  "pro_wizard.step_completed": { step: number, duration_ms: number },
  "pro_wizard.abandoned": { step: number, reason?: string },
  "pro_wizard.completed": { has_team: boolean },

  // Conversions
  "upgrade.cta_clicked": { location: string },
  "upgrade.completed": { from: "bienvenue" | "compte" | "banner" },

  // Activation Locataire
  "tenant.magic_link_sent": {},
  "tenant.activated": { method: "magic_link" | "password" },

  // Favoris
  "favorites.anonymous_added": { count: number },
  "favorites.sync_prompted": {},
  "favorites.sync_completed": { count: number },

  // Switch Role (multi-rôles)
  "role.switched": { from: string, to: string },
};
```

**Events critiques pour debug** :
- `login.success` → Comprendre comment les users se connectent
- `redirect.executed` → Débugger les loops de redirection et comprendre les parcours réels

### 10.3 Dashboard Recommandé

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD CONVERSION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   📊 FUNNEL PRO (30 derniers jours)                            │
│   ────────────────────────────────                              │
│                                                                 │
│   /pro (landing)          1,234 visiteurs                      │
│        ▼ (45%)                                                  │
│   Étape 1 (Email+MDP)       556 démarrés ← friction minimale   │
│        ▼ (85%)                                                  │
│   Étape 2 (Profil)          473                                │
│        ▼ (88%)                                                  │
│   Étape 3 (Agence)          416                                │
│        ▼ (85%)                                                  │
│   Étape 4 (Objectifs)       354                                │
│        ▼ (92%)                                                  │
│   Étape 5 (Confirmation)    326                                │
│        ▼ (95%)                                                  │
│   Compte créé               310 ✅                              │
│                                                                 │
│   Taux global: 25% (310/1234)                                  │
│                                                                 │
│   ──────────────────────────────────────────────────────────── │
│                                                                 │
│   📈 UPGRADE PROSPECTS                                          │
│   ────────────────────                                          │
│                                                                 │
│   Prospects inscrits (30j):    567                             │
│   CTA Upgrade cliqués:          89 (16%)                       │
│   Upgrades complétés:           34 (6%)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Points de Vigilance Techniques

> **Note**: Ces points sont critiques pour éviter des bugs subtils lors de l'implémentation.

### 11.1 Gestion du statut `expired` (CRITIQUE)

**Le problème** : La redirection actuelle pour `/gestion/*` renvoie vers `/pro/start`.

**Le risque** : Un utilisateur "Expired" (qui a déjà configuré ses biens mais n'a pas payé) ne doit PAS refaire le Wizard `/pro/start`. Il perdrait du temps et serait frustré.

**Solution** :

```typescript
// Middleware de protection AMÉLIORÉ
const ROUTE_PROTECTION = {
  "/gestion/*": {
    requireAuth: true,
    handler: async (profile) => {
      switch (profile.pro_status) {
        case "trial":
        case "active":
          return { allow: true };

        case "expired":
          // ⚠️ NE PAS rediriger vers /pro/start
          // Accès lecture seule + modale de paiement
          return {
            allow: true,
            mode: "read_only",
            showPaymentModal: true
          };

        case "none":
        default:
          return { allow: false, redirectTo: "/pro/start" };
      }
    }
  }
};
```

```
┌─────────────────────────────────────────────────────────────────┐
│              ÉTATS PRO ET COMPORTEMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   pro_status     │  /gestion      │  Action                     │
│   ───────────────┼────────────────┼─────────────────────────── │
│   "none"         │  ❌ Bloqué     │  → /pro/start (wizard)     │
│   "trial"        │  ✅ Accès      │  + Banner "X jours restants"│
│   "active"       │  ✅ Accès      │  Aucune restriction         │
│   "expired"      │  ⚠️ Lecture   │  + Modale paiement bloquante│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Route à créer** : `/gestion/subscription` pour gérer l'abonnement (pas `/pro/start`).

---

### 11.2 Sécurité des Magic Links Locataires

**Le risque** : Si le propriétaire se trompe d'email, n'importe qui clique et accède au bail.

**Solution** : Validation par confirmation d'identité (SANS création de mot de passe).

> **Rappel Modèle Hybride** : Les tenants n'ont PAS de compte `auth.users`. Pas de mot de passe.

```typescript
// Flux Magic Link sécurisé (premier accès)
async function handleFirstTenantAccess(token: string) {
  const tokenData = await validateTenantToken(token);

  if (!tokenData) {
    return redirect("/locataire/expired?error=invalid_link");
  }

  // Premier accès ? Demander confirmation d'identité
  if (!tokenData.first_access_verified) {
    return redirect(`/locataire/verify?token=${token}`);
  }

  // Accès vérifié → créer session et rediriger
  return redirect("/locataire");
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│          ÉCRAN /locataire/verify (Premier accès)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🔐 Vérification de votre identité                            │
│                                                                 │
│   Vous avez été invité par [Nom Propriétaire]                  │
│   pour accéder au bail de [Adresse Bien].                      │
│                                                                 │
│   Pour confirmer votre identité :                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Votre nom de famille *                                 │  │
│   │  [_________________________] (tel que sur votre bail)   │  │
│   │                                                         │  │
│   │              [ Accéder à mon espace ]                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ⚠️ 3 tentatives max, puis le lien est invalidé              │
│                                                                 │
│   ─────────────────────────────────────────────────────────── │
│                                                                 │
│   ❌ PAS DE MOT DE PASSE (modèle hybride)                      │
│   ✅ Session temporaire via cookie (24h)                       │
│   ✅ Renouvellement par nouveau Magic Link                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Règles de sécurité** :
- Validation du nom de famille (fuzzy match, ignore accents/casse)
- Token expire après 3 échecs de validation OU après 72h
- Session cookie courte (24h) - pas de session persistante
- Log des tentatives échouées pour audit
- Log des tentatives pour audit

---

### 11.3 Role Switcher pour Owners (Cookie)

> **Contexte Modèle Hybride** : Ce switcher concerne uniquement les Owners (auth.users) qui ont AUSSI un accès tenant (voir section 4.5).

**Le problème** : Un Owner qui loue aussi un bien (cas spécial) doit pouvoir naviguer entre `/gestion` et `/locataire`.

**Solution** : Cookie HttpOnly pour mémoriser la préférence (sync cross-device).

```typescript
// Cookie de préférence (pour Owners multi-espaces uniquement)
const OWNER_SPACE_PREFERENCE = "dousell_owner_space";

export function setOwnerSpacePreference(space: "gestion" | "locataire") {
  cookies().set(OWNER_SPACE_PREFERENCE, space, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 an
    path: "/"
  });
}

// Utilisé uniquement dans /gestion pour afficher le switch
async function ownerHasTenantSpace(ownerEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from("tenants")
    .select("id, lease:leases!inner(status)")
    .eq("email", ownerEmail)
    .eq("lease.status", "active")
    .maybeSingle();

  return data !== null;
}

// Smart Redirect pour USERS SYSTÈME uniquement
// ⚠️ Les tenants purs n'utilisent PAS cette fonction (ils ont leur Magic Link)
async function getSmartRedirectPath(explicitNext?: string): Promise<string> {
  if (explicitNext && isValidRedirectPath(explicitNext)) {
    return explicitNext;
  }

  const user = await getCurrentUser();
  if (!user) return "/";

  const profile = await getProfile(user.id);

  // Owner/Team → /gestion
  if (profile.pro_status === "trial" || profile.pro_status === "active") {
    return "/gestion";
  }

  // Team member sans pro_status personnel
  const teamMembership = await getTeamMembership(user.id);
  if (teamMembership) {
    return "/gestion";
  }

  // Prospect → /bienvenue ou /
  if (profile.first_login && profile.user_type === "prospect") {
    return "/bienvenue";
  }

  return "/";
}
```

**Note** : Le switch vers `/locataire` depuis `/gestion` nécessite un token tenant valide (voir section 4.5).

---

### 11.4 Sync Favoris : Implicite vs Explicite

**Le problème** : Demander "Voulez-vous importer ?" ajoute une friction cognitive.

**Solution** : Sync **implicite** par défaut, **explicite** seulement en cas de conflit.

```typescript
// Stratégie de sync adaptative
async function syncFavoritesOnLogin(userId: string): Promise<SyncResult> {
  const localFavorites = getLocalStorageFavorites(); // Côté client
  const serverFavorites = await getServerFavorites(userId);

  // Cas 1: Pas de favoris locaux → rien à faire
  if (localFavorites.length === 0) {
    return { action: "none", synced: 0 };
  }

  // Cas 2: Peu de favoris (< 10) et pas de conflit → sync silencieuse
  const conflicts = findConflicts(localFavorites, serverFavorites);

  if (localFavorites.length < 10 && conflicts.length === 0) {
    await mergeFavorites(userId, localFavorites);
    clearLocalStorageFavorites();
    return { action: "auto_merged", synced: localFavorites.length };
  }

  // Cas 3: Conflits ou beaucoup de favoris → demander
  return {
    action: "prompt_required",
    localCount: localFavorites.length,
    serverCount: serverFavorites.length,
    conflicts: conflicts.length
  };
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│              MATRICE DE DÉCISION SYNC FAVORIS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Favoris locaux  │  Conflits  │  Action                       │
│   ────────────────┼────────────┼────────────────────────────── │
│   0               │  -         │  Rien (pas de favoris)        │
│   1-9             │  0         │  ✅ Sync silencieuse          │
│   1-9             │  > 0       │  ⚠️ Prompt utilisateur        │
│   10+             │  any       │  ⚠️ Prompt utilisateur        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Toast de confirmation** (après sync silencieuse) :
```
✅ 5 favoris synchronisés depuis votre navigation précédente
```

---

## 12. Prochaines Actions

### Priorités de Migration (par ordre)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Renommer `/landing` → `/pro` | Clarté routes | Faible |
| 2 | Ajouter `user_type` + `pro_status` au schema | Évolutivité | Moyen |
| 3 | Créer `/bienvenue` post-inscription | UX + Conversion | Faible |
| 4 | Supprimer `/gestion-locative` | Réduction dette | Moyen |
| 5 | Implémenter `/locataire` | Parcours complet | Élevé |
| 6 | Setup analytics events | Mesure | Moyen |
| 7 | Gestion `expired` → `/gestion/subscription` | Rétention | Moyen |
| 8 | Sécuriser Magic Links (validation + mdp) | Sécurité | Moyen |
| 9 | Cookie role preference (cross-device) | UX Multi-rôles | Faible |
| 10 | Sync favoris implicite | UX Onboarding | Faible |

### Checklist Validation

- [ ] Valider le renommage `/landing` → `/pro` avec l'équipe
- [ ] Valider le modèle `pro_status` avec le backend
- [ ] Valider la stratégie favoris anonymes
- [ ] Valider la gestion `expired` (lecture seule vs redirect)
- [ ] **Valider le MODÈLE HYBRIDE User vs Tenant**
- [ ] Créer les tickets GitHub Issues
- [ ] Planifier Sprint 1 (consolidation)

---

> **Note**: Ce document est la version v1.6 alignée avec **CLAUDE.md** et **rental_management_workflow**. Utilise les tables existantes.

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 31/01/2026 | Version initiale |
| 1.1 | 31/01/2026 | Intégration feedback: `/landing`→`/pro`, `pro_status`, `/bienvenue`, analytics |
| 1.2 | 31/01/2026 | Ajustements finaux: ordre Smart Redirect, `?next=`, wizard 5 étapes, multi-rôles, vocabulaire unifié |
| 1.3 | 31/01/2026 | Version finale: règle user_type vs rôles dérivés, isTenant dynamique, limites front/back, events debug |
| 1.4 | 01/02/2026 | Points de vigilance: expired→subscription, Magic Link sécurisé, cookie role preference, sync favoris implicite |
| 1.5 | 01/02/2026 | **MODÈLE HYBRIDE**: Tenants hors auth.users, accès token-based, pas de mot de passe, sessions distinctes |
| 1.6 | 01/02/2026 | **ALIGNEMENT**: Référence CLAUDE.md, rental_management_workflow, utilise table `leases` (pas de table `tenants` séparée), audit existant, principes d'implémentation |

---

## Validation Finale

### Checklist Technique

- [x] Séparation nette Vitrine / Pro / Locataire
- [x] Modèle `user_type` + `pro_status` scalable (sans "tenant" dans user_type)
- [x] Smart Redirect pour Users Système (owner/team → /gestion)
- [x] Protection `?next=` avec validation
- [x] `/bienvenue` conditionnel (first_login + prospect)
- [x] **MODÈLE HYBRIDE** : User (auth.users) vs Tenant (token-based)
- [x] Tenants sans compte auth.users, accès via Magic Link
- [x] Tableau comparatif Owner/Team/Tenant documenté
- [x] Validation tenant par nom de famille (sans mot de passe)
- [x] Limites favoris front (UX) vs back (sécu) explicitées
- [x] Analytics events avec debug (login.success, redirect.executed)
- [x] Vocabulaire unifié (Dashboard gestion, etc.)
- [x] Gestion `pro_status: "expired"` → lecture seule + modale paiement
- [x] Magic Links sécurisés (validation nom, session 24h, pas de mdp)
- [x] Cookie pour préférence de rôle (sync cross-device, owners uniquement)
- [x] Sync favoris implicite (< 10 sans conflit)
- [x] Cas spécial Owner+Tenant documenté (deux sessions distinctes)
- [x] **ALIGNEMENT CLAUDE.md** : Reuse First, Minimal Changes, French-first
- [x] **ALIGNEMENT rental_management_workflow** : Owner-centric, pas de table tenants
- [x] Token Magic Link dans `leases.tenant_access_token` (pas de table séparée)
- [x] Audit existant documenté (routes, composants, actions, hooks)
- [x] Mapping Existant → Nouveau (modifications vs créations)

### Prêt pour

- ✅ Validation stakeholder
- ✅ Découpage en tickets GitHub
- ✅ Sprint planning
- ✅ Implémentation **avec respect des patterns existants**
